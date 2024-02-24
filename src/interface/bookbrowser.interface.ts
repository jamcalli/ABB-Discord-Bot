export interface SearchResult {
  data: EmbedData[];
}

export interface EmbedData {
  id: string;
  posted: string;
  cover: string;
}

export interface ExtendedBook extends EmbedData {
  title: string;
  torrent: {
    magnetUrl: string | undefined;
  };
}