import { logger } from '../bot'; 
import { AudioBookSearchResult, Audiobook } from "../interface/search.interface";

/**
 * Function to validate and fix a URL.
 * If the URL is empty or equals '/images/default_cover.jpg', it returns a default cover URL.
 * If the URL is valid, it returns the URL.
 * If the URL is invalid, it tries to fix the URL and returns the fixed URL if it's valid.
 * If the URL can't be fixed, it returns the default cover URL.
 */
export function validateAndFixUrl(url: string): string {
    const defaultCover = 'https://i.imgur.com/CgjfvMb.png';

    if (!url || url === '/images/default_cover.jpg') {
        return defaultCover;
    }

    try {
        new URL(url);
        return url;
    } catch (e) {
        logger.error(`Invalid URL: ${url}`);

        if (url.startsWith('//')) {
            const fixedUrl = 'http:' + url;
            try {
                new URL(fixedUrl);
                logger.info(`Fixed URL: ${fixedUrl}`);
                return fixedUrl.replace('///', '//');
            } catch (e) {
                logger.error(`Could not fix URL: ${url}`);
                return defaultCover;
            }
        } else if (!url.startsWith('http')) {
            const fixedUrl = 'http://' + url;
            try {
                new URL(fixedUrl);
                logger.info(`Fixed URL: ${fixedUrl}`);
                return fixedUrl.replace('///', '//');
            } catch (e) {
                logger.error(`Could not fix URL: ${url}`);
                return defaultCover;
            }
        } else {
            return defaultCover;
        }
    }
}

/**
 * Function to fix the cover URLs in a search result.
 * It iterates over the items in the search result data and fixes the cover URL for each item.
 * If the cover URL is corrected or not valid, it logs the old and new cover URLs.
 */
export function fixCoverUrls(searchResult: AudioBookSearchResult): AudioBookSearchResult {
    const defaultCover = 'https://i.imgur.com/CgjfvMb.png';
    if (searchResult.data) {
      searchResult.data.forEach((item: Audiobook) => {
        const oldCover = item.cover;
        const newCover = validateAndFixUrl(oldCover);
        if (newCover === defaultCover || oldCover !== newCover) {
          item.cover = newCover;
          logger.info(`Cover URL corrected: ${oldCover} -> ${item.cover}`);
        } else if (newCover && oldCover === newCover) {
          //logger.info(`Cover URL is valid: ${item.cover}`);
        } else {
          item.cover = defaultCover;
          logger.info(`Cover URL not valid, using default: ${defaultCover}`);
        }
      });
    }
    return searchResult;
}

/**
 * Function to trim the search results.
 * It maps over the items in the search result data and trims each item.
 * If a property of an item is missing, it sets the property to 'NA'.
 * It counts the number of corrections made and logs the number.
 */
export function trimSearchResults(searchResult: AudioBookSearchResult): AudioBookSearchResult {
  let corrections = 0;

  const data = searchResult.data.map(item => {
    item.info = item.info || { format: 'NA', unit: 'NA', size: 'NA', sizeUnit: 'NA' };
    const newItem = {
      id: item.id || 'NA',
      title: item.title || 'NA',
      cover: item.cover || 'NA',
      posted: item.posted || 'NA',
      lang: item.lang || 'NA',
      categories: item.categories || ['NA'],
      info: {
        format: item.info.format || 'NA',
        unit: item.info.unit || 'NA',
        size: item.info.size || 'NA',
        sizeUnit: item.info.sizeUnit || 'NA',
      }
    };

    corrections += Object.values(newItem).filter(value => value === 'NA').length;
    corrections += Object.values(newItem.info).filter(value => value === 'NA').length;

    return newItem;
  });

  logger.info(`Made ${corrections} corrections in search results`);

  return { 
    data: data, 
    pagination: searchResult.pagination 
  };
}