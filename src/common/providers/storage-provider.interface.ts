export interface StorageProviderInterface {

  uploadFile(file: Express.Multer.File): string | Promise<string>;

  uploadFiles(file: Express.Multer.File[]): string[] | Promise<string[]>;

  deleteFile(fileName: string): void | Promise<void>;

  deleteFiles(fileNames: string[]): void | Promise<void>;

}