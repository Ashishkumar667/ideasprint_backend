/**
 * transaction controller
 */

// import { factories } from '@strapi/strapi'

// export default factories.createCoreController('api::transaction.transaction');

import { factories } from '@strapi/strapi';
import getRawBody from 'raw-body';
import nodemailer from 'nodemailer';
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
      console.error('🔴 Stripe Error:', err);
      ctx.throw(500, 'Stripe session creation failed');
    }
  },

  //webhook
  async stripeWebhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'];
    const rawBody = await getRawBody(ctx.req);

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed.', err.message);
      return ctx.badRequest('Webhook Error');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const stripePaymentId = session.id;

      const [transaction] = await strapi.entityService.findMany('api::transaction.transaction', {
        filters: { stripePaymentId },
        populate: ['users_permissions_user', 'demo_schema'],
      }) as any;

      if (transaction) {
        await strapi.entityService.update('api::transaction.transaction', transaction.id, {
          data: { pay_status: 'paid' },
        });
        
          if (transaction.demo_schema?.id) {
          await strapi.entityService.update('api::demo-schema.demo-schema', transaction.demo_schema.id, {
            data: {
              Payment_status: 'paid',
            },
          });
        }

        const email = transaction.receiptEmail;

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"IdeaSprint" <${process.env.SMTP_USER}>`,
          to: email,
          subject: '✅ Payment Successful!',
          html: `<p>Thank you for your payment of <strong>₹${transaction.amount / 100}</strong> for your demo MVP.</p>`,
        });
      }
    }

    ctx.send({ received: true });
  },

}));
// }));

