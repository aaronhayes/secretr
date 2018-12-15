/*
 * All content level checks
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 15-December-2018
 * @flow
 */
import { regex } from './regex';

const CONTENT_LEVEL_CHECKS = [regex];

export const completeContentLevelChecks = async (commit: Object, owner: string, repo: string) => {
  let annotations = [];

  for (const check of CONTENT_LEVEL_CHECKS) {
    const checkRes = await check(commit, owner, repo);
    annotations = [...annotations, ...checkRes];
  }

  return annotations;
};
