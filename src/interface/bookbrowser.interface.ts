interface SearchResult {
    data: EmbedData[];
    // other properties...
  }
  
  interface EmbedData {
    id: string;
    posted: string;
    cover: string;
    // other properties...
  }
  
  interface ExtendedBook {
    id: string;
    posted: string;
    cover: string;
    torrent: {
      magnetUrl: string;
    };
    title: string;
    // other properties...
  }
  
  interface Error {
    message: string;
    // other properties...
  }