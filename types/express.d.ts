declare namespace Express {
  export interface Request {
    user: {
      id: number;
      metaData: Record<string, any>;
    };
  }
}
