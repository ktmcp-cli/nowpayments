/**
 * Authentication utilities for NOWPayments CLI
 *
 * Handles API key validation and authentication headers.
 */

const chalk = require('chalk');
const { getApiKey } = require('./config');

/**
 * Validate that an API key is available
 * @param {Object} program - Commander program instance
 * @throws {Error} If no API key is found
 */
function requireApiKey(program) {
  const apiKey = getApiKey(program);

  if (!apiKey) {
    console.error(chalk.red('Error: No API key found'));
    console.error(chalk.yellow('\nPlease set your API key using one of these methods:'));
    console.error('  1. Environment variable: export NOWPAYMENTS_API_KEY=your_key');
    console.error('  2. .env file: NOWPAYMENTS_API_KEY=your_key');
    console.error('  3. Command flag: --api-key your_key');
    console.error('  4. Save to config: nowpayments auth set your_key');
    console.error(chalk.cyan('\nGet your API key at: https://nowpayments.io'));
    process.exit(1);
  }

  return apiKey;
}

/**
 * Get authentication headers for API requests
 * @param {Object} program - Commander program instance
 * @returns {Object} Headers object with authentication
 */
function getAuthHeaders(program) {
  const apiKey = requireApiKey(program);

  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  };
}

/**
 * Validate API key format (basic check)
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the key appears valid
 */
function validateApiKeyFormat(apiKey) {
  // Basic validation - NOWPayments API keys are typically alphanumeric
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Check length (typical API keys are 32-64 characters)
  if (apiKey.length < 20 || apiKey.length > 100) {
    return false;
  }

  // Check for valid characters (alphanumeric and common symbols)
  return /^[a-zA-Z0-9_-]+$/.test(apiKey);
}

module.exports = {
  requireApiKey,
  getAuthHeaders,
  validateApiKeyFormat
};
