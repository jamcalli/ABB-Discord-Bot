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
  
  export interface Book {
    title: string;
    id: string;
    lang: string;
    description: string;
    cover: string;
    posted: string;
    specs: {
      format: string;
      bitrate: string;
    };
  }
  
  export interface SearchResult {
    data: any[];
  }
  
  export interface Torrent {
    name: string;
  }
  
  export interface Interaction {
    editReply: (options: any) => Promise<any>;
  }
  
  export interface Client {
    users: {
      fetch: (userId: string) => Promise<any>;
    };
  }