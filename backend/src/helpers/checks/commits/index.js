/*
 * All commit level checks
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 15-December-2018
 * @flow
 */
import { dotenv } from './dotenv';

const COMMIT_LEVEL_CHECKS = [dotenv];

export const completeCommitLevelChecks = (commit: Object) => {
  let annotations = [];

  for (const check of COMMIT_LEVEL_CHECKS) {
    annotations = [...annotations, ...check(commit)];
  }

  return annotations;
};
