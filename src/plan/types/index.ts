export enum PlanTypeEnum {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}

export enum SeedPlanNamesEnum {
  BASIC_PLAN = 'Basic Plan',
  PREMIUM_PLAN = 'Premium Plan',
  ENTERPRISE_PLAN = 'Enterprise Plan',
}

export enum FeatureLimitTypeEnum {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
  ALL_TIME = 'All Time',
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
