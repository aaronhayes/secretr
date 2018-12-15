import handly from '@harijoe/handly';
import * as mdd from 'middy/middlewares';

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { completeContentLevelChecks } from '../../helpers/checks/contents';

const octokit = require('@octokit/rest')();

const GITHUB_APP_ID = 21663;
const PRIVATE_KEY =
  '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAn1jrSct+jygbJzqUF2RVg4JvX+M1UW6XpaOOBO/DGlXT4ogn\nWoEvv4sk3chHjDpTyYJNQx6a+CRMFH7ReqZjsfQU9u/I+fxe+Li2CfJTRGYMHHRc\nOLQxaY2gwO0bxZwaTwF4q45pG9sqZ/6yzPiuZKpBMDBBLpFqrvncapGBe8D6XQHw\nYUQDl8/ZE/BXPpSfdtG4e30rTBNvC26wQUeqEVXy9lMOnjL6ysoKm1Icfnr8acda\nMrNKK6GsMLKZ+qkiC2ZA7wFqLO6eKKFreRQUvJTo/mA6vOCoP9owg0mYSag9FZ2W\nXIGk0lgzxlEUFqrPlSGRg3ThvB/RQ4Snz/5+VwIDAQABAoIBAENZnflO3Ws8lF18\nUOOiMNKo6tIognystcP44SoM/PXAmRICYj/KopffA/IJmNQYQxnEzUs1QGLpVI7F\nG10vvquUctf8eYHPvYR67dY+ahta1nugYupEny3yAqQIk9huJmCGSq6YPqzbcY0L\nBh/EbFF39J2dh69bHzBdw1/3qDbZqw8QvtcMNgFCgMI/cExlBwBde+GCbHR4VtAL\nbCRQpn3vidqrS7EC5THrOboQfBbt4XPZqEzkA2GqAw0H2R6l9CiZ9WCl5STsTyJi\nRkUEHkXZV97scwvCmyEJ3ta6LcvAV00Eom1b85qtzpKBu6ROZtUHFDs3HdB7Eyi+\nS1OHGwECgYEA019jbdibYZlJNmgIQ+7ali14Nm9J6gUdDQUeeNaOAZgU6Xgx14hH\n8es1ts00rjMxe/ZlnS9RkHAy2AXCz+UpgkgVwLl94FTj7DWuI1n37fL8t5MMRk+4\nK06AE9IgHLd7d6ZehQYjuMgd8f/jgarsBJq8Nynn26sbiTPwXOai9KECgYEAwP2V\nglnUZIDxThU5o6JWOsXs+Bgekm5cyh8ihd1HvDo0p6gA2MdWlvgMSkrllwmmzeGz\neNvJYUDfbNo1tkiFsqE1+hEbiEPmSBYOcmHG/CVQf0U2JAnil79c2Ut0fCUG7N3H\noX4C0z9WOtKDeU0UkMJyR6j2jnF+Y3SZGQaKF/cCgYBJVD5aTVsacONFTLIRXzvV\n/dBGkjVCSqPZcH0xzr1VMD2RAXHJJC5RbxgjYu1zwa7ZIpH+Bfx173a0GsuK9CWC\nXR+uzKsuuESaHcVb3kp08mdaCFmpyt5Jp+Im/i7Fx6G90KnZ3FdoM4Sv/+Ydhf57\nWnMRcChPvPzAjJRGpnzCAQKBgQC0QSYP5g83AChiIfkAGXQo2Q0IfJ6xbltEfegk\n2BVUfZkIryZ7U1RRFcWE7oealu0xhwm2bLKfH5SPexCH/RzDR0e/FZN9ps3DrrY3\np5PPlpqlBOQYrRLzYU07t/pIqdzaCBuZfrTs0k+cCVu7RH9c5gEPZYVEbkT6Z8FH\nWpBI6QKBgQCwYzsAZjumFtzKFq9wGsPRopgzZpfKbemShTHvW6uVXDwpacKC87aH\nXiji5pW1u1gjhEwB2lBXSXd77UCFiOpLG4aADh7lzZB6ppjIZpvcN8g6K8seuSQ0\nTwt1v4abrHFJdnGqdhK9YLpxFa8JlQuZrV7PAyDhSc2laUdvLhW5ZA==\n-----END RSA PRIVATE KEY-----\n';

const JWT_ALG = 'RS256';

const signRequestBody = (key, body) => {
  return `sha1=${crypto
    .createHmac('sha1', key)
    .update(body, 'utf-8')
    .digest('hex')}`;
};

const createJwtToken = () => {
  const payload = {
    iat: Date.now() / 1000,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
    iss: GITHUB_APP_ID
  };

  return jwt.sign(payload, PRIVATE_KEY, { algorithm: JWT_ALG });
};

const handleRequest = async body => {
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

  const jwtToken = createJwtToken();

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

  const commit = await octokit.repos.getCommit({ owner, repo, sha: headSha });

  let error = null;

  // COMMIT LEVEL CHECKS
  error = completeCommitLevelChecks(commit);

  // CONTENTS LEVEL CHECKS
  if (!error) {
    error = completeContentLevelChecks(commit);
  }

  const completedAt = new Date();

  if (error) {
    return await octokit.checks.create({
      owner,
      repo,
      name: 'Secretr',
      head_sha: headSha,
      status: 'complete',
      conclusion: 'failure',
      completedAt: completedAt.toISOString()
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

const gitHubWebookListner = async (event, context, callback) => {
  const webhookSecret = 'f0f2d58c3a00954232eb46bdc90b21456637d1a5';
  const { headers, body } = event;

  // GitHub Headers
  const sig = headers['X-Hub-Signature'];
  const githubEvent = headers['X-Github-Event'];
  const id = headers['X-Github-Delivery'];

  const calculatedSig = signRequestBody(webhookSecret, JSON.stringify(body));
  // console.log(body);

  if (typeof webhookSecret !== 'string') {
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

  switch (body.action) {
    case 'requested': {
      result = handleRequest(body);
      break;
    }
    case 'rerequested': {
      result = handleRequest(body);
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
