export const dotenvCheck = commit => {
  const files = commit.data.files;
  const failure = false;

  // Check each file name
  for (const file of files) {
    if (file.filename.endsWith('.env') || file.filename.startsWith('.env')) {
      failure = true;
      break;
    }
  }

  // Return Failure Object
  if (failure) {
    return {
      conclusion: 'failure',
      output: {
        title: 'dotenv file committed',
        summary: 'dotenv files often contain senstive data; and should not be committed. Use envrionemnt variables instead.'
      },
      annotations: [
        {
          path: file.path,
          start_line: 1,
          end_line: 1
        }
      ]
    };
  }

  // null indicates no error
  return null;
};
