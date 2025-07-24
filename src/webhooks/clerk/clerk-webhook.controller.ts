import { Controller, Post, Req, Headers, BadRequestException } from '@nestjs/common';
import { ClerkWebhookService } from './clerk-webhook.service';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/backend';
import { Public } from 'src/common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks/clerk')
export class ClerkWebhookController {
  constructor(
    private readonly clerkWebhookService: ClerkWebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('/')
  async handleClerkWebhook(@Req() req: any, @Headers('svix-id') svixId: string, @Headers('svix-timestamp') svixTimestamp: string, @Headers('svix-signature') svixSignature: string) {
    if (!svixId || !svixTimestamp || !svixSignature) throw new BadRequestException('Missing webhook headers');

    try {
      const secret = this.configService.get<string>('creds.clerkWebhookSigningSecret');
      console.log({secret})
      const svix = new Webhook(secret);
      const payload = req.body;
      const headers = {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      };

      const event = svix.verify(JSON.stringify(payload), headers) as WebhookEvent;

      console.info('Clerk webhook authenticated');
      console.log(`Received clerk webhook with ID ${event.data.id} and event type of ${event.type}`);
      console.log('Clerk webhook payload: ', payload);

      // Handle different event types
      switch (event.type) {
        case 'user.created':
        case 'user.updated':
          return this.clerkWebhookService.syncUser(event.data);
        
        case 'organization.created':
        case 'organization.updated':
          return this.clerkWebhookService.syncOrganization(event.data);
        
        case 'organizationMembership.created':
        case 'organizationMembership.updated':
        case 'organizationMembership.deleted':
          return this.clerkWebhookService.syncOrganizationMembership(event);
        
        default:
          return { message: 'Webhook received', event: event.type };
      }
    } catch (error) {
      throw new BadRequestException('Invalid Webhook Signature');
    }
  }
}
