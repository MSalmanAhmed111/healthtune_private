import { UnsupportedMediaTypeException } from '@nestjs/common';
import { FileStorageErrorMessages } from '@messages';

export function fileMimetypeFilter(...mimetypes: string[]) {
  return (req, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    if (mimetypes.some((m) => file.mimetype.includes(m))) {
      callback(null, true);
    } else {
      callback(new UnsupportedMediaTypeException(`${FileStorageErrorMessages.fileType}: ${mimetypes.join(', ')}`), false);
    }
  };
}
