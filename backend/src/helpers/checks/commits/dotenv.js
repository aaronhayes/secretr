/*
 * Checks for .env files and fails tests if any exist.
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 15-December-2018
 * @flow
 */
export const dotenv = (commit: Object) => {
  const files = commit.data.files;
  let failure = false;

  const annotations = [];

  // Check each file name
  for (const file of files) {
    if (file.filename.endsWith('.env') || file.filename.startsWith('.env')) {
      failure = true;
      annotations.push({
        path: file.filename,
        start_line: 1,
        end_line: 1,
        annotation_level: 'failure',
        message: 'dotenv files often contain senstive data; and should not be committed. Use envrionemnt variables instead.',
        title: 'Dotenv File Detected!'
      });
    }
  }

  // Return all built up annotations
  return annotations;
};
