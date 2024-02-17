import { AudioBookSearchResult } from "../interface/search";
import { audiobookBayUrl } from "../constants";
import logger from './logger'; 

export function validateAndFixUrl(url: string): string | null {
    // Check if url is '/images/default_cover.jpg'
    if (url === '/images/default_cover.jpg') {
        url = audiobookBayUrl + url;
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
                return null;
            }
        } else if (!url.startsWith('http')) {
            const fixedUrl = 'http://' + url;
            try {
                new URL(fixedUrl);
                logger.info(`Fixed URL: ${fixedUrl}`);
                return fixedUrl.replace('///', '//');
            } catch (e) {
                logger.error(`Could not fix URL: ${url}`);
                return null;
            }
        } else {
            return null;
        }
    }
}

export function fixCoverUrls(searchResult: AudioBookSearchResult): AudioBookSearchResult {
    if (searchResult.data) {
      searchResult.data.forEach((item: Item) => {
        if (item.cover) {
          const oldCover = item.cover;
          const newCover = validateAndFixUrl(item.cover);
          if (newCover && oldCover !== newCover) {
            item.cover = newCover;
            logger.info(`Cover URL corrected: ${oldCover} -> ${item.cover}`);
          }
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