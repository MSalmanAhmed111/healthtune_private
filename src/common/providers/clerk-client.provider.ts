import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

export const ClerkClientProvider = {
  provide: 'ClerkClient',
  useFactory: (configService: ConfigService) => {
    return createClerkClient({
      publishableKey: configService.get('creds.clerkPublishableKey'),
      secretKey: configService.get('creds.clerkSecretKey'),
    });
  },
  inject: [ConfigService],
};
