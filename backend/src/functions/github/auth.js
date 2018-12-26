/*
 * Handles GitHub Auth callbacks
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 26-December-2018
 * @flow
 */
import handly from '@harijoe/handly';
import * as mdd from 'middy/middlewares';

const gitHubCallbackAuth = async (event, context, callback) => {
  const result = {};

  const response = {
    statusCode: 301,
    headers: {
      Location: 'https://www.secretr.co'
    },
    body: {}
  };

  return callback(null, response);
};

export default handly(gitHubCallbackAuth).use(mdd.cors());
