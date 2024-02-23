export interface Info {
    format: string;
    unit: string;
    size: string;
    sizeUnit: string;
  }
  
export interface Item {
    id: string;
    title: string;
    cover: string;
    posted: string;
    lang: string;
    info: Info;
  }