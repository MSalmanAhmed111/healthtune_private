export const dateFormat = 'YYYY-MM-DD';

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

export enum SettingNames {
  Language = 'Language',
}


export const SettingTypes: { [key in SettingNames]: string } = {
  [SettingNames.Language]: 'string',
};