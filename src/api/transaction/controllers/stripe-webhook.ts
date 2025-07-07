// import getRawBody from 'raw-body';
// import nodemailer from 'nodemailer';
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// // export default async function stripeWebhook(ctx) {
// export const stripeWebhook = async (ctx) => {
//   const sig = ctx.request.headers['stripe-signature'];
//   const rawBody = await getRawBody(ctx.req);

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   } catch (err) {
//     console.error('⚠️ Webhook signature verification failed.', err.message);
//     return ctx.badRequest('Webhook Error');
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object;
//     const stripePaymentId = session.id;

    
//     const [transaction] = await strapi.entityService.findMany('api::transaction.transaction', {
//       filters: { stripePaymentId },
//       populate: ['users_permissions_user'],
//     });

//     if (transaction) {
//       await strapi.entityService.update('api::transaction.transaction', transaction.id, {
//         data: {
//           pay_status: 'paid',
//         },
//       });

//       const email = transaction.receiptEmail;

//       const transporter = nodemailer.createTransport({
//         host: process.env.SMTP_HOST,
//         port: parseInt(process.env.SMTP_PORT || '587', 10),
//         secure: false,
//         auth: {
//           user: process.env.SMTP_USER,
//           pass: process.env.SMTP_PASS,
//         },
//       });

//       await transporter.sendMail({
//         from: `"IdeaSprint" <${process.env.SMTP_USER}>`,
//         to: email,
//         subject: '✅ Payment Successful!',
//         html: `<p>Thank you for your payment of <strong>₹${transaction.amount / 100}</strong> for your demo MVP.</p>`,
//       });
//     }
//   }

//   ctx.send({ received: true });
// }
