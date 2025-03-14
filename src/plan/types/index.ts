export enum PlanTypeEnum {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}

export enum FeatureLimitTypeEnum {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}
export enum PlanFeatureNameEnum {
  SESSION_CREATION = 'Session Creation',
  DOCTOR_ONBOARDING = 'Doctor Onboarding',
  TEMPLATE_CUSTOMIZATION = 'Template Customization',
  DOCUMENT_GENERATION = 'Document Generation',
  MACRO_REPLACEMENT = 'Macros & Replace',
}

export interface BaseFeatureProperties {
  isUnlimited?: boolean | undefined;
  limit?: number | null | undefined;
  limitType?: FeatureLimitTypeEnum | null | undefined;
}
