export interface Command {
    data: {
      toJSON: Function;
    };
    execute: Function;
  }
  