import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanTypeEnum, UserCardDetails } from '@types';
import Stripe from 'stripe';

@Injectable()
export class StripeHelper {
  private stripe: Stripe;
  private readonly endpointSecret: string;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: this.configService.get('STRIPE_API_VERSION'),
      typescript: true,
    });
    this.endpointSecret = this.configService.get('STRIPE_WEBHOOK_SIGNING_SECRET');
  }

  /** Webhook Handlers*/
  // Converts request to stripe events
  public async stripeEvent(payloadString: string): Promise<Stripe.Event> {
    const header = this.stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: this.endpointSecret,
    });
    return this.stripe.webhooks.constructEvent(payloadString, header, this.endpointSecret);
  }

  /** Sessions APIs*/
  // Create customer for future payments
  public async createCustomer(userIds: { id: number; clerkUserId: string }, email: string, name: string = ''): Promise<string> {
    const customer = await this.stripe.customers.create({ email, name, metadata: { ...userIds } });
    return customer.id;
  }

  public async createCardSession(metaData: object, stripeCustomerId: string, successUrl: string, cancelUrl: string): Promise<string> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'setup',
        customer: stripeCustomerId,
        metadata: { ...metaData },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return session.url;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Create payment session
  public async createPaymentSession(
    metaData: object,
    stripeCustomerId: string,
    successUrl: string,
    cancelUrl: string,
    // product: StripeProduct
    priceId: string,
  ): Promise<string> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: stripeCustomerId,
        // payment_method_collection: "if_required",
        metadata: { ...metaData },
        mode: 'subscription',
        // mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            // price_data: {
            //   currency: "usd",
            //   product_data: { name: product.name, description: product.description, images: product.images },
            //   unit_amount: product.amount * 100
            //   // recurring: { interval: "month" }
            // },
            price: priceId,
            quantity: 1,
          },
        ],
      });
      return session.url;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async cancelSubscription(subscriptionId: string, comment?: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId, { cancellation_details: { comment } });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  /** Card APIs*/
  // Retrieve saved card (If customer has any)
  public async retrieveCard(stripeCustomerId: string): Promise<UserCardDetails> {
    try {
      const paymentMethods = await this.stripe.customers.listPaymentMethods(stripeCustomerId, { type: 'card' });
      const cardDetails = paymentMethods.data[0];
      return {
        id: cardDetails?.id,
        brand: cardDetails?.card.brand,
        country: cardDetails?.card.country,
        expiryMonth: cardDetails?.card.exp_month,
        expiryYear: cardDetails?.card.exp_year,
        last4: cardDetails?.card.last4,
        holderName: cardDetails?.billing_details.name,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async retrieveCards(stripeCustomerId: string): Promise<UserCardDetails[]> {
    try {
      const paymentMethods = await this.stripe.customers.listPaymentMethods(stripeCustomerId, { type: 'card' });
      if (!paymentMethods) return undefined;
      let userCards: UserCardDetails[] = [];
      if (paymentMethods?.data.length) {
        userCards = paymentMethods.data.map((obj) => ({
          id: obj.id,
          brand: obj.card.brand,
          country: obj.card.country,
          expiryMonth: obj.card.exp_month,
          expiryYear: obj.card.exp_year,
          last4: obj.card.last4,
          holderName: obj?.billing_details.name,
        }));
      }
      return userCards;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Detach payment method
  public async deleteCard(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  /** Product APIs*/
  public async createProduct(name: string, description: string, images: string[] | null = undefined): Promise<Stripe.Response<Stripe.Product>> {
    try {
      return await this.stripe.products.create({
        name,
        description,
        images,
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // Get Product by id
  public async getProduct(productId: string): Promise<Stripe.Response<Stripe.Product>> {
    try {
      return await this.stripe.products.retrieve(productId);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // Get All products
  public async getProducts(limit: number): Promise<Stripe.Response<Stripe.ApiList<Stripe.Product>>> {
    try {
      return await this.stripe.products.list({
        limit,
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // Delete product
  public async deleteProduct(productId: string): Promise<void> {
    try {
      await this.stripe.products.del(productId);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // Update product
  public async updateProduct(productId: string, stripeProduct: Stripe.Response<Stripe.Product>): Promise<Stripe.Response<Stripe.Product>> {
    try {
      const { name, description, images } = stripeProduct;
      return await this.stripe.products.update(productId, {
        name,
        description,
        images,
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // Archive product
  public async archiveProduct(productId: string): Promise<void> {
    try {
      await this.stripe.products.update(productId, { active: false });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  /** Price APIs*/
  public async createProductPrice(productId: string, amount: number, planType: PlanTypeEnum): Promise<Stripe.Response<Stripe.Price>> {
    try {
      return await this.stripe.prices.create({
        unit_amount: amount * 100,
        currency: 'usd',
        recurring: { interval: planType === PlanTypeEnum.MONTHLY ? 'month' : planType === PlanTypeEnum.YEARLY ? 'year' : 'month' },
        product: productId,
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public async updatePrice(priceId: string, stripePrice: Stripe.Response<Stripe.Price>): Promise<Stripe.Response<Stripe.Price>> {
    try {
      const { unit_amount, currency } = stripePrice;

      return await this.stripe.prices.update(priceId, {
        currency_options: {
          [currency]: {
            unit_amount: unit_amount * 100,
          },
        },
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public async getProductPrice(priceId: string): Promise<Stripe.Response<Stripe.Price>> {
    try {
      return await this.stripe.prices.retrieve(priceId);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  public async getProductPrices(limit: number): Promise<Stripe.Response<Stripe.ApiList<Stripe.Price>>> {
    try {
      return await this.stripe.prices.list({ limit });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  // Archive a price, as price can't be deleted or updated using APIs
  public async archiveProductPrice(priceId: string): Promise<Stripe.Response<Stripe.Price>> {
    try {
      return await this.stripe.prices.update(priceId, { active: false });
    } catch (e) {
      throw new Error(e.message);
    }
  }
}
