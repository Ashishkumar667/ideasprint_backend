// export default {
//   routes: [
//     {
//       method: 'POST',
//       path: '/transactions/checkout',
//       handler: 'transaction.createCheckoutSession',
//       config: {
//         auth: {
//           scope: ['api::transaction.transaction.create'],
//         },
//         policies: [],
//       },
//     },
//     {
//       method: 'POST',
//       path: '/stripe/webhook',
//       handler: 'transaction.stripeWebhook',
//       config: {
//         auth: false,
//         policies: [],
//       },
//     },
//   ],
// };

export default {
  routes: [
    {
      method: 'POST',
      path: '/transactions/checkout',
      handler: 'transaction.createCheckoutSession',
      config: {
        auth: {
          scope: ['api::transaction.transaction.create'],
        },
        policies: [],
      },
    },
    
    {
      method: 'GET',
      path: '/transactions/confirm',
      handler: 'transaction.getSessionAndSendReceipt',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};

