const octokit = require('@octokit/rest')();

const STRONG_REGEX = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{6,64})/g;

export const regex = commit => {
  // TODO Actual Regex Check
  for (const file of commit.data.files) {
    // Only support certain file types
    if (!file.filename.endsWith('.js')) {
      continue;
    }

    const contents = await octokit.repos.getContents({
      owner,
      repo,
      path: file.filename,
      ref: commit.sha
    });

    // Decode file contents to search for keys
    const buffer = Buffer.from(contents.data.content, contents.data.encoding);
    const fileContents = buffer.toString('ascii');
    console.log(fileContents);

    const lines = fileContents.split(/[\r\n]+/);

    for (const [index, line] of lines.entries()) {
      if (line.test(STRONG_REGEX)) {
        // Match found; return error
        return {
          conclusion: 'failure',
          output: {
            title: 'Password or Key Detected',
            summary: 'A strong password or secret key has been detected. Check this file carefully.'
          },
          annotations: [
            {
              path: file.filename,
              start_line: index + 1,
              end_line: index + 1
            }
          ]
        };
      }
    }
  }

  // null indicates no error
  return null;
};
