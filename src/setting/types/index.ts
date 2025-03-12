export const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ur', name: 'Urdu' },
];

export const languageNames = languages.map((x) => x.name);

export enum SettingNames {
  Language = 'Language',
  EnablePatientRecords = 'Enable patient records',
}

export const SettingTypes: { [key in SettingNames]: string } = {
  [SettingNames.Language]: 'string',
  [SettingNames.EnablePatientRecords]: 'boolean',
};
