import { Body, Controller, Post } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeWebhookService: StripeWebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('/')
  async handleStripeWebhook(@Body() payload: any) {
    return this.stripeWebhookService.checkOutWebhook(payload);
  }
}
