/*
 * Configure SQS Queues
 * 
 * Example AWS CLI Commands:
 *    - aws sqs list-queues --endpoint-url=http://localhost:4576
 *    - aws sqs send-message --message-body="test" --queue-url=http://localhost:4576/queue/GitHubCheckQueue --endpoint-url=http://localhost:4576
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 16-December-2018
 * @flow
 */

const AWS = require('aws-sdk');
const commandLineArgs = require('command-line-args');

const VALID_STAGES = ['staging', 'prod'];

const credentials = new AWS.SharedIniFileCredentials({ profile: 'secretr' });
AWS.config.update({
  region: 'us-east-1',
  credentials
});

/**
 * Confgiure SQS
 */
async function configureSQS (stage) {
  let SQS;
  if (stage === 'dev') {
    SQS = new AWS.SQS({ endpoint: new AWS.Endpoint('http://localhost:4576') });
  } else if (VALID_STAGES.includes(stage)) {
    SQS = new AWS.SQS();
  } else {
    return Promise.reject(new Error('Unknown environment: example usage: node init/init.js --stage dev'));
  }

  const params = {
    QueueName: `${stage}-GitHubCheckQueue`
  };

  return await SQS.createQueue(params, function (err, data) {
    if (err) {
      if (err.message.includes('A queue already exists with the same name')) {
        console.log('SQS Queue: ALREADY EXISTS');
        return Promise.resolve();
      } else {
        console.error('INIT SQS ERROR: ', err);
        return Promise.reject(err);
      }
    }
    console.log('SQS INIT COMPLETE');
    return Promise.resolve();
  });
}

const optionDefinitions = [
  { name: 'stage', type: String, defaultOption: 'dev' }
];

const args = commandLineArgs(optionDefinitions);

configureSQS(args.stage)
  .then()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
