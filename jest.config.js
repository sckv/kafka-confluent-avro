module.exports = {
  ...require('code-concierge').jest,
  setupFiles: [`${__dirname}/jest-setup.js`],
};
