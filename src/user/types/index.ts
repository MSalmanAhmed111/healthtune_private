export interface UserCardDetails {
  id: string;
  brand: string;
  country: string;
  expiryMonth: number;
  expiryYear: number;
  last4: string;
  holderName: string;
}

export enum SubscriptionStatusEnum {
  SUBSCRIBED = 'Subscribed',
  CANCELLED = 'Cancelled',
  EXPIRED = 'Expired',
  RENEWED = 'Renewed',
  RENEW_FAILED = 'Renew failed',
  FAILED = 'Failed',
  PENDING = 'Pending',
}

export enum PaymentMethodEnum {
  CREDIT_CARD = 'Credit Card',
  DEBIT_CARD = 'Debit Card',
  PAYPAL = 'PayPal',
  BANK_TRANSFER = 'Bank Transfer',
  CRYPTO = 'Crypto',
  CASH = 'Cash',
  OTHER = 'Other',
}
