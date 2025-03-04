export const dateFormat = 'YYYY-MM-DD';

export interface imageObject {
  id: number;
  image: string;
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

export enum GenderEnum {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum LanguageEnum {
  URDU = 'Urdu',
  ENGLISH = 'English',
}

export enum SortEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}
