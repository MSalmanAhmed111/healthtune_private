import { ConfigService } from '@nestjs/config';
import { Stripe } from 'stripe';

export const StripeClientProvider = {
  provide: 'StripeClient',
  useFactory: (configService: ConfigService) => {
    return new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: configService.get('STRIPE_API_VERSION'),
      typescript: true,
    });
  },
  inject: [ConfigService],
};
