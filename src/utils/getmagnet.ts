import { getAudiobook } from "../utils/getAudiobook";

export async function getMagnetLink(item: any) {
    const book = await getAudiobook(item.id);
    return book;
  }