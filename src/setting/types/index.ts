export const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ur', name: 'Urdu' },
];

export const languageNames = languages.map((x) => x.name);

export enum SettingNames {
  Language = 'Language',
}

export const SettingTypes: { [key in SettingNames]: string } = {
  [SettingNames.Language]: 'string',
};
