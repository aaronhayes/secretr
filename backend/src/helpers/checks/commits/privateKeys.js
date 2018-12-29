/*
 * Checks for private key files.
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 29-December-2018
 * @flow
 */
export const privateKey = (commit: Object) => {
  const files = commit.data.files;
  let failure = false;

  const annotations = [];

  // Check each file name
  for (const file of files) {
    if (file.filename.endsWith('.pem') || file.filename.endsWith('_rsa')) {
      failure = true;
      annotations.push({
        path: file.filename,
        start_line: 1,
        end_line: 1,
        annotation_level: 'failure',
        message: 'You should not be commiting private keys.',
        title: 'Private Key Detected!'
      });
    }
  }

  // Return all built up annotations
  return annotations;
};
