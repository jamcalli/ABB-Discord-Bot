export interface SearchResult {
  data: EmbedData[];
}

export interface EmbedData {
  title: string;
  id: string;
  lang: string;
  info: {
    format: string;
    unit: string;
    size: string;
    sizeUnit: string;
  };
  cover: string;
  posted: string;
}

export interface ExtendedBook extends EmbedData {
  title: string;
  torrent: {
    magnetUrl: string | undefined;
  };
}