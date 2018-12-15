import { dotenv } from './dotenv';

const COMMIT_LEVEL_CHECKS = [dotenv];

export const completeCommitLevelChecks = commit => {
  let result = null;

  for (const check in COMMIT_LEVEL_CHECKS) {
    result = check(commit);
    if (result) {
      break;
    }
  }

  return result;
};
