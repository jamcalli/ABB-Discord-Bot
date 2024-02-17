import { AudioBookSearchResult } from "../interface/search";
import logger from './logger'; 

export function validateAndFixUrl(url: string): string {
    const defaultCover = 'https://imgur.com/a/BwUY8lk';

    // Check if url is empty or '/images/default_cover.jpg'
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

export function fixCoverUrls(searchResult: AudioBookSearchResult): AudioBookSearchResult {
    const defaultCover = 'https://i.imgur.com/CgjfvMb.png';
    if (searchResult.data) {
      searchResult.data.forEach((item: Item) => {
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

  export function trimSearchResults(searchResult: AudioBookSearchResult): AudioBookSearchResult {
    let corrections = 0;
  
    const data = searchResult.data.map(item => {
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
  
      // Count corrections
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