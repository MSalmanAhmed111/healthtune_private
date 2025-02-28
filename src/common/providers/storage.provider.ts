import { LocalStorageProvider } from "./local-storage.provider";
import { AwsStorageProvider } from "./aws-storage.provider";


export function storageProviderFactory(storageProvider: string) {
  if (storageProvider === "aws") {
    return new AwsStorageProvider();
  } else if (storageProvider === "local") {
    return new LocalStorageProvider();
  } else {
    throw new Error(`Invalid storageProvider: ${process.env.STORAGE_PROVIDER}`);
  }
}