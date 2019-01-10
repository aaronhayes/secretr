/*
 * Checks for common credential files.
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 10-Jaunuary-2019
 * @flow
 */
const COMMON_CREDS_FILE = ['creds.json', 'credentials.json'];

export const creds = (commit: Object) => {
  const files = commit.data.files;
  let failure = false;

  const annotations = [];

  // Check each file name
  for (const file of files) {
    if (COMMON_CREDS_FILE.contains(file.filename)) {
      failure = true;
      annotations.push({
        path: file.filename,
        start_line: 1,
        end_line: 1,
        annotation_level: 'failure',
        message: 'Should not be committing credential files.',
        title: 'Credentials File Detected!'
      });
    }
  }

  // Return all built up annotations
  return annotations;
};
