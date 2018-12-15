/*
 * KMS Secrets
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 25-December-2018
 * @flow
 */
import { KMS } from './index';

let SECRETS;

const loadSecrets = async () => {
  let decrypted;
  try {
    decrypted = (await KMS.decrypt({
      // $FlowFixMe
      CiphertextBlob: Buffer.from(process.env.SECRETS, 'base64')
    }).promise()).Plaintext.toString();
  } catch (error) {
    console.error('KMS Decryption Error: ', error);
    throw error;
  }

  return JSON.parse(decrypted);
};

export const getSecrets = async () => {
  if (!SECRETS) {
    SECRETS = await loadSecrets();
  }
  return SECRETS;
};
