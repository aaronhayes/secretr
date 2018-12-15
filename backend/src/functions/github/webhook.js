/*
 * Handles GitHub webhooks
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 15-December-2018
 * @flow
 */
import handly from '@harijoe/handly';
import * as mdd from 'middy/middlewares';

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { SQS, githubCheckQueue } from '../../helpers/aws';
import { getSecrets } from '../../helpers/aws/kms';
import { completeContentLevelChecks } from '../../helpers/checks/contents';
import { completeCommitLevelChecks } from '../../helpers/checks/commits';

import { createJwtToken, signRequestBody } from '../../helpers/github/jwt';

const octokit = require('@octokit/rest')();

const queueRequest = async (body: Object) => {
  // Fetch QueueURL
  let queueUrl;
  const params = { QueueName: githubCheckQueue };

  await SQS.getQueueUrl(params, (err: Error, data: any) => {
    if (err) {
      console.error('Queueing Get Queue URL Error', err);
      throw err;
    } else {
      queueUrl = data.QueueUrl;
    }
  }).promise();

  // Add message to queue
  const opts = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(body),
    DelaySeconds: 0
  };

  await SQS.sendMessage(opts, (err: Error, data: Object) => {
    if (err) {
      console.error('Queueing Request Error', err);
      throw err;
    } else {
      console.log('Message Queued');
    }
  });
};

const gitHubWebookListner = async (event, context, callback) => {
  const { WEBHOOK_SECRET } = await getSecrets();
  const { headers, body } = event;

  // GitHub Headers
  const sig = headers['X-Hub-Signature'];
  const githubEvent = headers['X-Github-Event'];
  const id = headers['X-Github-Delivery'];

  const calculatedSig = signRequestBody(WEBHOOK_SECRET, JSON.stringify(body));

  if (typeof WEBHOOK_SECRET !== 'string') {
    console.error('FAIL WEBHOOK SECRET');
    return callback(new Error('[401] must provide GITHUB_WEBOOK_SECRET'));
  }

  if (!githubEvent) {
    console.error('FAIL GitHub-Event');
    return callback(new Error('[401] must provide X-Github-Event Header'));
  }

  if (!id) {
    console.error('FAIL ID');
    return callback(new Error('[401] must provide X-Github-Delivery Header'));
  }

  if (sig !== calculatedSig) {
    console.error('FAIL SIG');
    return callback(new Error('[401] X-Hub-Signature incorrect.'));
  }

  let result = {};

  console.log('GITHUB WEBOOK: ', body.action);

  const jwtToken = await createJwtToken();

  octokit.authenticate({
    type: 'app',
    token: jwtToken
  });

  const installToken = await octokit.apps.createInstallationToken({
    installation_id: body.installation.id
  });

  octokit.authenticate({
    type: 'token',
    token: installToken.data.token
  });

  switch (body.action) {
    case 'rerequested':
    case 'requested': {
      const repoFullName = body.repository.full_name.split('/');
      const owner = repoFullName[0];
      const repo = repoFullName[1];
      let headSha;
      if (body.check_suite) {
        headSha = body.check_suite.head_sha;
      } else if (body.check_run) {
        headSha = body.check_run.head_sha;
      } else {
        console.log('Unknown GitHub Body');
        return callback(new Error('Unknown GitHub Body'));
      }

      try {
        queueRequest(body);
        result = await octokit.checks.create({
          owner,
          repo,
          name: 'Secretr',
          head_sha: headSha
        });
      } catch (err) {
        result = await octokit.checks.create({
          owner,
          repo,
          name: 'Secretr',
          head_sha: headSha,
          status: 'completed',
          conclusion: 'cancelled',
          completed_at: new Date().toISOString()
        });
      }
      break;
    }
    default:
      break;
  }

  const response = {
    statusCode: 200,
    body: {
      result: result
    }
  };

  return callback(null, response);
};

export default handly(gitHubWebookListner).use(mdd.cors());
