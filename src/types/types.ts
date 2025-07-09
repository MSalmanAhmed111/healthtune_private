export const dateFormat = 'YYYY-MM-DD';

export interface fileObject {
  id: number;
  fileName: string;
}

export interface ApiMessage {
  message: string;
}

export interface ApiMessageData extends ApiMessage {
  data: object;
}

export interface ApiMessageDataPagination extends ApiMessageData {
  page: number;
  lastPage: number;
  total: number;
}

export enum AuthTypeEnum {
  ADMIN = 'admin',
  CLERK = 'clerk',
}


export interface StripeProduct {
  name: string,
  description: string,
  images: string[],
  amount: number
}

export enum GenderEnum {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum LanguageEnum {
  URDU = 'Urdu',
  ENGLISH = 'English',
  ARABIC = 'Arabic',
}

export enum SortEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

