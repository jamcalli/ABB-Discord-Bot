import axios from 'axios';
import { audiobookBayUrl } from "../constants";

export async function testSite() {
  return axios.get(audiobookBayUrl, {
    timeout: 5000, // Wait for 5 seconds
  })
    .then(function (response) {
      // handle success
      if(response.status == 200 || response.status == 201 || response.status == 202){
        //console.log(audiobookBayUrl + ' is up!!');
        return true;
      } else {
        console.log(audiobookBayUrl + ' is down or redirecting!!');
        return false;
      }
    })
    .catch(function (error) {
      // handle error
      console.log('Err: '+ error);
      return false;
    });
}