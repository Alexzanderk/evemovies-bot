import * as rp from 'request-promise';
import cheerio from 'cheerio';
import logger from '../logger';
import { ICheckerConfig } from '../release-checker';
import { isNumberInRage, checkStringSimiliarity } from '../common';

/**
 * Returns true if movie has been released, false otherwise
 * @param config - config to check the movie
 */
export async function scarabeyReleaseChecker(config: ICheckerConfig): Promise<Boolean> {
  logger.debug(undefined, 'Checking russian release for movie %s', config.title);

  const url = encodeURI(`http://scarabey.org/?s=${config.title}`);
  let response;

  try {
    response = await rp.get(url);
  } catch (e) {
    return false;
  }

  let released = false;
  const $ = cheerio.load(response, {
    decodeEntities: false
  });

  $('.post-row4').each((index, elem) => {
    if (!$(elem).html().length) {
      return;
    }

    try {
      const movieTitle = $(elem)
        .find('.archive-note3 a')
        .html()
        .replace(/ё/, 'е')
        .trim()
        .toLocaleLowerCase();

      const movieYear = $(elem)
        .find('.archive-year strong')
        .text();

      if (
        checkStringSimiliarity(movieTitle, config.title) &&
        isNumberInRage(+config.year, +movieYear)
      ) {
        released = true;
      }
    } catch (e) {
      // TODO: make if instead of try catch
      logger.error(undefined, 'Catch... %O', e);
    }
  });

  return released;
}
