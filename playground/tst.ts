import { explore } from "../src/index";

async function fetchAudiobooks() {
  const audiobooks = await explore("category", "postapocalyptic", 2);
  console.log(audiobooks);
}

fetchAudiobooks();