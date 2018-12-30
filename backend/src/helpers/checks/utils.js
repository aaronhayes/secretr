/*
 * Helpers and utils
 *
 * --------
 * @package: @secretr
 * @author: Aaron Hayes (aaron.hayes92@gmail.com)
 * @since: 30-December-2018
 * @flow
 */
export const getConclusionLevel = (annotations: Array<Object>) => {
  let conclusion = 'neutral'; // default to neutral

  // Iterate through annotations looking for failure level instance
  for (const annotation of annotations) {
    if (annotation.annotation_level === 'failure') {
      conclusion = 'failure';
      break;
    }
  }

  // All done :)
  return conclusion;
};
