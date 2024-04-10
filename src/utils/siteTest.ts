import axios from 'axios';
import { audiobookBayUrl } from "../constants.ts";
import { logger } from '../bot.ts'; 

/**
 * Function to test if the site is up or down.
 * It sends a GET request to the site and checks the response status.
 * If the status is 200, 201, or 202, it logs that the site is up and returns true.
 * If the status is anything else, it logs that the site is down or redirecting and returns false.
 * If there's an error with the request, it logs the error and returns false.
 */
export async function testSite() {
  try {
    const response = await axios.get(audiobookBayUrl, {
      timeout: 5000, // Wait for 5 seconds
    });

    // handle success
    if(response.status === 200 || response.status === 201 || response.status === 202){
      logger.info(`${audiobookBayUrl} is up!!`);
      return true;
    } else {
      logger.error(`${audiobookBayUrl} is down or redirecting!!`);
      return false;
    }
  } catch (error) {
    // handle error
    logger.error(`Error: ${error}`);
    return false;
  }
}