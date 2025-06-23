'use strict';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  async handlePayment(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized("User not authenticated");

    const { amount, currency, receiptEmail } = ctx.request.body;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: receiptEmail,
      metadata: { userId: user.id },
    });

    // Save transaction in Strapi
    const transaction = await strapi.entityService.create('api::transaction.transaction', {
      data: {
        amount,
        currency,
        receiptEmail,
        stripePaymentId: paymentIntent.id,
        status: 'pending',
        user: user.id,
      },
    });

    return ctx.send({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    });
  },
};
