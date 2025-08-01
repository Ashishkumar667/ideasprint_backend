// /**
//  * transaction controller
//  */

// // import { factories } from '@strapi/strapi'

// // export default factories.createCoreController('api::transaction.transaction');

import { factories } from '@strapi/strapi';
import getRawBody from 'raw-body';
import nodemailer from 'nodemailer';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default factories.createCoreController('api::transaction.transaction', ({ strapi }) => ({
  async createCheckoutSession(ctx) {
    try {
      const { planId, receiptEmail, demoSchemaId } = ctx.request.body;

      const user = ctx.state.user;
      if (!user || !user.id) {
        return ctx.unauthorized('You must be logged in to create a payment.');
      }
     
          const plan = await strapi.entityService.findOne('api::plan.plan', planId);

    if (!plan) {
      return ctx.badRequest('Invalid plan selected.');
    }

    const { price, currency, name } = plan;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: currency || 'inr',
              product_data: {
                name: `Payment to IdeaSprint for demo ${name} Plan`,
              },
              unit_amount:  Number(plan.price) * 100, // in paisa or cents
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        customer_email: receiptEmail,
      });

      
      const newTransaction = await strapi.entityService.create('api::transaction.transaction', {
        data: {
          price,
          currency: currency || 'inr',
          receiptEmail,
          pay_status: 'pending',
          stripePaymentId: session.id,
          users_permissions_user: user.id ,
          demo_schema: demoSchemaId || null,
        },
      });

      
      console.log("✅ Stripe session.id created:", session.id);

      ctx.send({ checkoutUrl: session.url });
      console.log("checkouturl", session.url)
    } catch (err) {
      console.error(err);
      console.error('🔴 Stripe Error:', err);
      ctx.throw(500, 'Stripe session creation failed');
    }
  },

  //send receipt
  async getSessionAndSendReceipt(ctx) {
  const { session_id } = ctx.query;

  if (!session_id) {
    return ctx.badRequest('Missing session_id');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id as string);
    console.log("session", session);

    const paymentIntentId = session.payment_intent as string;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("payment Intent", paymentIntent);
    console.log("✅ Stripe session.id from frontend query:", session_id);

    
    const chargeId = paymentIntent.latest_charge;
    const charge = await stripe.charges.retrieve(chargeId);
    console.log("charge", charge);

    const receiptUrl = charge?.receipt_url;
    const email = session.customer_email;
    

    const existingTx = await strapi.db.query('api::transaction.transaction').findOne({
      where: { stripePaymentId: session.id },
      populate: {
              demo_schema: true, 
       },
    });
    console.log("🔍 Found DB transaction:", existingTx);

    if (!existingTx) {
      console.error("❌ No matching transaction found in DB for:", session.id);
    } else if (existingTx.pay_status !== 'paid') {
      console.log("✅ Updating DB status → paid");

      await strapi.db.query('api::transaction.transaction').update({
        where: { id: existingTx.id },
        data: { pay_status: 'paid' },
      });
    }
    
     if (existingTx.demo_schema && existingTx.demo_schema.id) {
        console.log(` Updating demoSchema #${existingTx.demo_schema.id} Payment_status → paid`);

        await strapi.db.query('api::demo-schema.demo-schema').update({
          where: { id: existingTx.demo_schema.id },
          data: { Payment_status: 'paid' ,
                  receipt_url: receiptUrl || 'not available',
          },
        });
      } else {
        console.log("⚠️ No linked demo_schema found for this transaction");
      }
    
    

     // send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

     const emailHtml = `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color: #6A1B9A;">✅ Payment Received</h2>
        <p>Hi ${session.customer_details?.name || 'Customer'},</p>
        <p>Thank you for your payment of <strong>$${session.amount_total / 100}</strong>.</p>
        ${receiptUrl ? `<p>📄 <a href="${receiptUrl}" target="_blank">Download Receipt</a></p>` : ''}
        <br/>
        <p>— IdeaSprint Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"IdeaSprint" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Payment Successful!',
      html: emailHtml,
    });

    ctx.send({ success: true, receiptUrl });

  } catch (err) {
    console.error('🔴 Error fetching session:', err);
    ctx.throw(500, 'Failed to fetch session or send receipt');
  }
}

}));
