import { getAudiobook } from "../utils/getAudiobook.ts";

export async function getMagnetLink(item: any) {
    const book = await getAudiobook(item.id);
    return book;
  }