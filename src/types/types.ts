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
  name: string;
  description: string;
  images: string[];
  amount: number;
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

export enum UserRolesEnum {
  ADMIN = 'Admin',
  STAFF = 'Staff',
  DOCTOR = 'Doctor',
}

export enum PermissionEnum {
  // Appointment
  CREATE_APPOINTMENT = 'org:appointment:create_appointment',
  VIEW_ALL_APPOINTMENTS = 'org:appointment:view_all_appointments',
  VIEW_APPOINTMENT = 'org:appointment:view_appointment',

  // Patients
  CREATE_PATIENT = 'org:patients:create_patient',
  VIEW_ALL_PATIENTS = 'org:patients:view_all_patients',
  VIEW_PATIENT = 'org:patients:view_patient',

  // Session
  CREATE_PATIENT_SESSION = 'org:session:create',
  SESSION_HISTORY = 'org:session:session_history',
  VIEW_ALL_SESSIONS = 'org:session:view_all_sessions',
  VIEW_SESSION = 'org:session:view_session',

  // Global
  VIEW_ALL_SESSION_SESSIONS = 'org:view_all_session_sessions',
  MANAGE_CUSTOMIZATIONS = 'org:view_all_session_sessions:manage_customizations',
}
