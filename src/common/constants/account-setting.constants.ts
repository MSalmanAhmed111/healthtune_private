export const batchCodeFormats = [
    {
        format: "Prefix-Timestamp",
        key: "PREFIX-TIMESTAMP"
    },
    {
        format: "Timestamp-Prefix",
        key: "TIMESTAMP-PREFIX"
    },
    {
        format: "Prefix-StartingNumber",
        key: "PREFIX-STARTINGNUMBER"
    },
    {
        format: "StartingNumber-Prefix",
        key: "STARTINGNUMBER-PREFIX"
    },
    {
        format: "Year-Prefix-StartingNumber",
        key: "YEAR-PREFIX-STARTINGNUMBER"
    },
    {
        format: "Prefix-Year-StartingNumber",
        key: "PREFIX-YEAR-STARTINGNUMBER"
    },


]

export const batchCodeFormatKeys = batchCodeFormats.map((x) => x.key)

export const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ur', name: 'Urdu' },
];

export const languageNames = languages.map((x) => x.name)

export const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'PKR', name: 'Pakistan Rupee' },
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'SAR', name: 'Saudi Riyal' }
];

export const currencyNames = currencies.map((x) => x.code)