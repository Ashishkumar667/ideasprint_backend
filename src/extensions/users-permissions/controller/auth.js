// // path: src/extensions/users-permissions/controllers/auth.js

// 'use strict';

// const utils = require('@strapi/utils');
// const { ValidationError } = utils.errors;
// const defaultAuthController = require('@strapi/plugin-users-permissions/controllers/auth');

// module.exports = {
//   async register(ctx) {
//     const { password, confirmPassword } = ctx.request.body;

//     if (!password || !confirmPassword) {
//       throw new ValidationError("Password and confirmPassword are required.");
//     }

//     if (password !== confirmPassword) {
//       throw new ValidationError("Passwords do not match.");
//     }

//     // Use default register behavior after validation
//     return await defaultAuthController.register(ctx);
//   }
// };
