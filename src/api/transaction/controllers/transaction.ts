/**
 * transaction controller
 */

// import { factories } from '@strapi/strapi'

// export default factories.createCoreController('api::transaction.transaction');

import { factories } from '@strapi/strapi';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default factories.createCoreController('api::transaction.transaction', ({ strapi }) => ({
  async createCheckoutSession(ctx) {
    try {
      const { amount, currency, receiptEmail, demoSchemaId } = ctx.request.body;

      const user = ctx.state.user;
      if (!user || !user.id) {
        return ctx.unauthorized('You must be logged in to create a payment.');
      }


      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: currency || 'inr',
              product_data: {
                name: 'Payment to IdeaSprint for demo',
              },
              unit_amount: amount * 100, // in paisa or cents
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL}/success`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        customer_email: receiptEmail,
      });

      
      const newTransaction = await strapi.entityService.create('api::transaction.transaction', {
        data: {
          amount,
          currency: currency || 'inr',
          receiptEmail,
          pay_status: 'pending',
          stripePaymentId: session.id,
          users_permissions_user: user.id ,
          demo_schema: demoSchemaId || null,
        },
      });

      ctx.send({ checkoutUrl: session.url });
    } catch (err) {
      console.error(err);
      ctx.throw(500, 'Stripe session creation failed');
    }
  },
}));

