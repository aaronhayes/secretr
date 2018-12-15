/*
 * AWS Configurations
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 16-December-2018
 * @flow
 */
const AWS = require('aws-sdk');

export const DEFAULT_REGION: string = 'us-east-1';
export const ENV: string = process.env.ENV || 'dev';
export const PREFIX: string = `${ENV}-`;

const credentials = new AWS.SharedIniFileCredentials({ profile: 'secretr' });
AWS.config.update({
  region: DEFAULT_REGION,
  credentials
});

// Local Endpoints
const sqsLocalEndpoint: string = 'http://localhost:4576';

// AWS Services
let SQS;
let KMS;

// Service Resource Names
export const githubCheckQueue: string = `${PREFIX}GitHubCheckQueue`;

if (ENV === 'dev') {
  SQS = new AWS.SQS({ endpoint: new AWS.Endpoint(sqsLocalEndpoint) });
  KMS = new AWS.KMS();
} else {
  SQS = new AWS.SQS();
  KMS = new AWS.KMS();
}

export { SQS, KMS };
