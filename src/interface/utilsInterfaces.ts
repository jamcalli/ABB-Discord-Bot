interface Info {
    format: string;
    unit: string;
    size: string;
    sizeUnit: string;
  }
  
  interface Item {
    id: string;
    title: string;
    cover: string;
    posted: string;
    lang: string;
    info: Info;
  }