import { Controller } from "@nestjs/common";
import { StripeWebhookService } from "./stripe-webhook.service";
import { ConfigService } from "@nestjs/config";


@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeWebhookService: StripeWebhookService,
    private readonly configService: ConfigService,
  ) {}
}
