import axios from 'axios';
import { audiobookBayUrl } from "../constants";
import logger from '../utils/logger'; 

export async function testSite() {
  return axios.get(audiobookBayUrl, {
    timeout: 5000, // Wait for 5 seconds
  })
    .then(function (response) {
      // handle success
      if(response.status == 200 || response.status == 201 || response.status == 202){
        logger.info(audiobookBayUrl + ' is up!!');
        return true;
      } else {
        logger.error(audiobookBayUrl + ' is down or redirecting!!');
        return false;
      }
    })
    .catch(function (error) {
      // handle error
      logger.error('Err: '+ error);
      return false;
    });
}