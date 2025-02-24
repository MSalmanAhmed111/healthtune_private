import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { SettingNames, SettingTypes } from '@types';
import { languageNames } from '@constants/setting.constants';
import { SettingDto } from 'src/setting/dto';

export function IsValidSettingType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidSettingType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          console.log({ ARGS: args.object });
          const setting = args.object as SettingDto;
          const settingName = setting.name;
          const isSettingNameExists = Object.values(SettingNames).includes(settingName as SettingNames);
          console.log({ value, setting, settingName });
          if (!isSettingNameExists) return false;

          const expectedType = SettingTypes[settingName];

          switch (settingName) {
            case 'Language':
              return languageNames.includes(value);

            default:
              switch (expectedType) {
                case 'string':
                  return typeof value === 'string';
                case 'number':
                  return typeof value === 'number';
                case 'boolean':
                  return typeof value === 'boolean';
                case 'object':
                  return typeof value === 'object';
                default:
                  return false;
              }
          }
        },
        defaultMessage(args: ValidationArguments) {
          const settingName = args.object['name'];

          const isSettingNameExists = Object.values(SettingNames).includes(settingName);
          if (!isSettingNameExists) return 'Invalid setting name specified';
          const expectedType = settingName ? SettingTypes[settingName] : 'unknown';

          switch (settingName) {
            case 'Language':
              return `${args.property} must be one of the valid languages: ${languageNames.join(', ')}`;
            default:
              return `${args.property} must be of type ${expectedType}`;
          }
        },
      },
    });
  };
}
