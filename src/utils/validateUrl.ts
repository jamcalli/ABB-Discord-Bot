import { AudioBookSearchResult } from "../interface/search";
import { audiobookBayUrl } from "../constants";
import logger from '../utils/logger'; 

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

interface Item {
    cover?: string | null;
  }
  

  export function fixCoverUrls(searchResult: AudioBookSearchResult): AudioBookSearchResult {
    if (searchResult.data) {
      searchResult.data.forEach((item: Item) => {
        if (item.cover) {
          const oldCover = item.cover;
          item.cover = validateAndFixUrl(item.cover);
          if (oldCover !== item.cover) {
            logger.info(`Cover URL corrected: ${oldCover} -> ${item.cover}`);
          }
        }
      });
    }
    return searchResult;
  }