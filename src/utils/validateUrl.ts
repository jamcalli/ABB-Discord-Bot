import { AudioBookSearchResult } from "../interface/search";
import { audiobookBayUrl } from "../constants";

export function validateAndFixUrl(url: string): string | null {
    // Check if url is '/images/default_cover.jpg'
    if (url === '/images/default_cover.jpg') {
        url = audiobookBayUrl + url;
    }

    try {
        new URL(url);
        return url;
    } catch (e) {
        console.error(`Invalid URL: ${url}`);

        if (url.startsWith('//')) {
            const fixedUrl = 'http:' + url;
            try {
                new URL(fixedUrl);
                console.log(`Fixed URL: ${fixedUrl}`);
                return fixedUrl.replace('///', '//');
            } catch (e) {
                console.error(`Could not fix URL: ${url}`);
                return null;
            }
        } else if (!url.startsWith('http')) {
            const fixedUrl = 'http://' + url;
            try {
                new URL(fixedUrl);
                console.log(`Fixed URL: ${fixedUrl}`);
                return fixedUrl.replace('///', '//');
            } catch (e) {
                console.error(`Could not fix URL: ${url}`);
                return null;
            }
        } else {
            return null;
        }
    }
}

interface Item {
    cover?: string | null;
    // other properties...
  }
  
  interface SearchResult {
    data?: Item[];
    // other properties...
  }

  export function fixCoverUrls(searchResult: AudioBookSearchResult): AudioBookSearchResult {
    if (searchResult.data) {
      searchResult.data.forEach((item: Item) => {
        if (item.cover) {
          item.cover = validateAndFixUrl(item.cover);
        }
      });
    }
    return searchResult;
  }