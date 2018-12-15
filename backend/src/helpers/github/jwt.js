/*
 * GitHub JWT Token and Singer helpers
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 16-December-2018
 * @flow
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { getSecrets } from '../aws/kms';

const RSAKey = require('rsa-key');

const JWT_ALG = 'RS256';

export const signRequestBody = (key: string, body: string) => {
  return `sha1=${crypto
    .createHmac('sha1', key)
    .update(body, 'utf-8')
    .digest('hex')}`;
};

export const createJwtToken = async () => {
  const { GITHUB_APP_ID, PRIVATE_KEY } = await getSecrets();

  // Weird new encodings in ecrypted PRIVATE KEY
  const key = new RSAKey(PRIVATE_KEY);

  const payload = {
    iat: Date.now() / 1000,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
    iss: GITHUB_APP_ID
  };

  return jwt.sign(payload, key.exportKey(), { algorithm: JWT_ALG });
};
