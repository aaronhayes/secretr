/*
 * Handle running checks from SQS queue
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 16-December-2018
 * @flow
 */
import handly from '@harijoe/handly';
import * as mdd from 'middy/middlewares';

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { SQS, githubCheckQueue } from '../../helpers/aws';
import { completeContentLevelChecks } from '../../helpers/checks/contents';
import { completeCommitLevelChecks } from '../../helpers/checks/commits';

import { createJwtToken, signRequestBody } from '../../helpers/github/jwt';

const octokit = require('@octokit/rest')();

const handleRequest = async (body: Object) => {
  const repoFullName = body.repository.full_name.split('/');
  const owner = repoFullName[0];
  const repo = repoFullName[1];

  let headSha;
  if (body.check_suite) {
    headSha = body.check_suite.head_sha;
  } else if (body.check_run) {
    headSha = body.check_run.head_sha;
  } else {
    throw new Error('Unknown GitHub body');
  }

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

  // Notify check is in progress
  await octokit.checks.create({
    owner,
    repo,
    name: 'Secretr',
    head_sha: headSha,
    status: 'in_progress',
    started_at: new Date().toISOString()
  });

  // Fetch commit contents
  const commit = await octokit.repos.getCommit({ owner, repo, sha: headSha });

  // Complete all checks and collect annotations
  const commitLevelCheckRes = completeCommitLevelChecks(commit);
  const contentLevelCheckRes = await completeContentLevelChecks(commit, owner, repo);

  const annotations = [...commitLevelCheckRes, ...contentLevelCheckRes];

  const completedAt = new Date();

  if (annotations.length > 0) {
    return await octokit.checks.create({
      owner,
      repo,
      name: 'Secretr',
      head_sha: headSha,
      status: 'completed',
      conclusion: 'failure',
      completed_at: completedAt.toISOString(),
      output: {
        title: 'Secretr',
        summary: `Secretr has found at ${annotations.length} potential leaks with this commit.`,
        annotations: annotations
      }
    });
  } else {
    return await octokit.checks.create({
      owner,
      repo,
      name: 'Secretr',
      head_sha: headSha,
      status: 'completed',
      conclusion: 'success',
      completed_at: completedAt.toISOString()
    });
  }
};

export const handleGitHubQueueCheck = async (event: any, context: any, callback: Function) => {
  if (!event.Records) {
    return callback(null);
  }

  const body = JSON.parse(event.Records[0].body);

  try {
    const res = handleRequest(body);
    return callback(null, JSON.stringify(res));
  } catch (err) {
    return callback(err);
  }
};
