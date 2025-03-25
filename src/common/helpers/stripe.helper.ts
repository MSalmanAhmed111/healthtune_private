import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanTypeEnum } from '@types';
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
