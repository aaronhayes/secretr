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

const STRONG_PASSWORD = {
  regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#\$%\^&\*\(\)-_\+`~\[\]\{\};:'"<,>\.\?\/\\\|])[A-Za-z\d!@#\$%\^&\*\(\)-_\+`~\[\]\{\};:'"<,>\.\?\/\\\|]{8,128}$/g,
  tilte: 'Strong Password',
  message: 'Possible password detected - check this file',
  annotationLevel: 'warning'
};

const AWS_CLIENT_ID = {
  regex: /AKIA[0-9A-Z]{16}/g,
  title: 'AWS Client ID',
  message: 'This looks like an AWS Client ID',
  annotationLevel: 'failure'
};

const AWS_SECRET_KEY = {
  regex: /[0-9a-zA-Z/+]{40}/g,
  title: 'AWS Secret Key',
  message: 'This looks like an AWS Secret Key',
  annotationLevel: 'failure'
};

const PKCS8 = {
  regex: /-----BEGIN PRIVATE KEY-----/g,
  title: 'Private Key',
  message: 'Potential Private Key Leaked',
  annotationLevel: 'failure'
};

const RSA = {
  regex: /-----BEGIN RSA PRIVATE KEY-----/g,
  title: 'Private RSA Key',
  message: 'Potential Private RSA Key Leaked',
  annotationLevel: 'failure'
};

const SSH = {
  regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
  title: 'Private SSH Key',
  message: 'Potential Private SSH Key Leaked',
  annotationLevel: 'failure'
};

const PGP = {
  regex: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
  title: 'Private PGP Key',
  message: 'Potential Private PGP Key Leaked',
  annotationLevel: 'failure'
};

const FACEBOOK = {
  regex: /(.{0,4})?['\"][0-9a-f]{32}['\"]/g,
  title: 'Facebook API Key',
  message: 'Possible Facebook API key detected',
  annotationLevel: 'failure'
};

const TWITTER = {
  regex: /(.{0,4})?['\"][0-9a-zA-Z]{35,44}['\"]/g,
  title: 'Twitter API Key',
  message: 'Possible Twitter API key detected',
  annotationLevel: 'failure'
};

const GITHUB = {
  regex: /(.{0,4})?['\"][0-9a-zA-Z]{35,40}['\"]/g,
  title: 'GitHub API Key',
  message: 'Possible GitHub API key detected',
  annotationLevel: 'failure'
};

const SLACK = {
  regex: /xox[baprs]-([0-9a-zA-Z]{10,48})?/g,
  title: 'Slack API Key',
  message: 'Possible Slack API key detected',
  annotationLevel: 'failure'
};

const STRIPE = {
  regex: /sk_(live|test)_[0-9a-zA-Z]{24}/g,
  title: 'Stripe API Key',
  message: 'Possible Stripe API key detected',
  annotationLevel: 'failure'
};

const GENERIC_API_KEY = {
  regex: /[0-9A-Z]{48}/g,
  title: 'API Key',
  message: 'Possible API key detected',
  annotationLevel: 'failure'
};

const REGEX_CHECKS: Array<Object> = [
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
  GENERIC_API_KEY
];

const WHITELIST_FILE_TYPES_REGEX = /^.*\.(icon|ico|css|svg|lock|xls|xlsx|doc|docx|jpg|jpeg|gif|pdf|png|bin|pyc|exe|)$/g;

export const testFile = (filePath: string, fileContents: string) => {
  const annotations = [];

  const lines = fileContents.split(/[\r\n]+/);

  for (const [index, line] of lines.entries()) {
    for (const regexCheck of REGEX_CHECKS) {
      if (regexCheck.regex.test(line)) {
        // Match found; add annotation
        annotations.push({
          path: filePath,
          start_line: index + 1,
          end_line: index + 1,
          annotation_level: regexCheck.annotationLevel || 'failure',
          message: regexCheck.message,
          title: regexCheck.title
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
