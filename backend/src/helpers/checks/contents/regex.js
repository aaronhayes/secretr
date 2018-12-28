/*
 * Regex check for secret API Keys and Passwords.
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 15-December-2018
 * @flow
 */
const octokit = require('@octokit/rest')();

const STRONG_PASSWORD = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{6,64})/g;
const AWS_CLIENT_ID = /AKIA[0-9A-Z]{16}/g;
const AWS_SECRET_KEY = /[0-9a-zA-Z/+]{40}/g;
const PKCS8 = /-----BEGIN PRIVATE KEY-----/g;
const RSA = /-----BEGIN RSA PRIVATE KEY-----/g;
const SSH = /-----BEGIN OPENSSH PRIVATE KEY-----/g;
const PGP = /-----BEGIN PGP PRIVATE KEY BLOCK-----/g;
const FACEBOOK = /(.{0,4})?['\"][0-9a-f]{32}['\"]/g;
const TWITTER = /(.{0,4})?['\"][0-9a-zA-Z]{35,44}['\"]/g;
const GITHUB = /(.{0,4})?['\"][0-9a-zA-Z]{35,40}['\"]/g;
const SLACK = /xox[baprs]-([0-9a-zA-Z]{10,48})?/g;
const STRIPE = /sk_(live|test)_[0-9a-zA-Z]{24}/g;
const FOURSQUARE = /[0-9A-Z]{48}/g;

const REGEX_CHECKS = [
  STRONG_PASSWORD,
  AWS_CLIENT_ID,
  AWS_SECRET_KEY,
  PKCS8,
  RSA,
  SSH,
  PGP,
  FACEBOOK,
  TWITTER,
  GITHUB,
  SLACK,
  STRIPE,
  FOURSQUARE
];

const WHITELIST_FILE_TYPES_REGEX = /^.*\.(lock|xls|xlsx|doc|docx|jpg|jpeg|gif|pdf|png|bin|pyc|exe|)$/g;

export const testFile = (filePath: string, fileContents: string) => {
  const annotations = [];

  const lines = fileContents.split(/[\r\n]+/);

  for (const [index, line] of lines.entries()) {
    for (const regexCheck of REGEX_CHECKS) {
      if (regexCheck.test(line)) {
        // Match found; add annotation
        annotations.push({
          path: filePath,
          start_line: index + 1,
          end_line: index + 1,
          annotation_level: 'failure',
          message: 'Suspicious string detected. Check this file carefully.',
          title: 'Secret Key Suspected!'
        });

        // We've matched that line at least once; don't need to continously check it
        break;
      }
    }
  }

  return annotations;
};

export const regex = async (commit: Object, owner: string, repo: string) => {
  const files = commit.data.files;
  let annotations = [];

  for (const file of files) {
    // Whitelist certain filetypes
    if (WHITELIST_FILE_TYPES_REGEX.test(file.filename)) {
      continue;
    }

    // $FlowFixMe
    const contents = await octokit.repos.getContents({
      owner: owner,
      repo: repo,
      path: file.filename,
      ref: commit.data.sha
    });

    // Decode file contents to search for keys
    const buffer = Buffer.from(contents.data.content, contents.data.encoding);
    const fileContents = buffer.toString('ascii');

    annotations = [...annotations, ...testFile(file.filename, fileContents)];
  }

  // Return all our built up annotation
  return annotations;
};
