'use strict';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  async handleWebhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        ctx.request.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return ctx.badRequest('Webhook Error');
    }

    const intent = event.data.object;
    const stripeId = intent.id;

    if (event.type === 'payment_intent.succeeded') {
      await strapi.db.query('api::transaction.transaction').updateMany({
        where: { stripePaymentId: stripeId },
        data: { status: 'success' },
      });
    }

    if (event.type === 'payment_intent.payment_failed') {
      await strapi.db.query('api::transaction.transaction').updateMany({
        where: { stripePaymentId: stripeId },
        data: { status: 'failed' },
      });
    }

    ctx.send({ received: true });
  },
};
