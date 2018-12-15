import { regex } from './regex';

const CONTENT_LEVEL_CHECKS = [regex];

export const completeContentLevelChecks = commit => {
  let result = null;

  for (const check in COMMIT_LEVEL_CHECKS) {
    check(commit);
  }

  return result;
};
