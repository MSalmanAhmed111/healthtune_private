import { SetMetadata } from '@nestjs/common';
export const AUTH_TYPE_KEY = 'authType';
export const AuthType = (type: 'admin' | 'clerk' | 'org:admin' | ('admin' | 'clerk' | 'org:admin')[]) => SetMetadata(AUTH_TYPE_KEY, type);
