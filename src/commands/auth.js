/**
 * Authentication command
 *
 * Manage API keys and authentication configuration.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { setConfig, getConfig, CONFIG_FILE } = require('../lib/config');
const { validateApiKeyFormat } = require('../lib/auth');

const command = new Command('auth');

command
  .description('Manage API authentication')
  .summary('Configure and manage API keys');

// Set API key
command
  .command('set <api-key>')
  .description('Save API key to config file')
  .action((apiKey) => {
    if (!validateApiKeyFormat(apiKey)) {
      console.error(chalk.red('Error: Invalid API key format'));
      console.error(chalk.yellow('API keys should be 20-100 alphanumeric characters'));
      process.exit(1);
    }

    setConfig('apiKey', apiKey);
    console.log(chalk.green('✓ API key saved successfully'));
    console.log(chalk.gray(`Config file: ${CONFIG_FILE}`));
  });

// Show current API key (masked)
command
  .command('show')
  .description('Display current API key configuration (masked)')
  .action(() => {
    const apiKey = getConfig('apiKey');

    if (!apiKey) {
      console.log(chalk.yellow('No API key configured'));
      console.log(chalk.gray('\nSet an API key with: nowpayments auth set YOUR_KEY'));
      return;
    }

    // Mask the API key (show first 4 and last 4 characters)
    const masked = apiKey.length > 8
      ? `${apiKey.substring(0, 4)}${'*'.repeat(apiKey.length - 8)}${apiKey.substring(apiKey.length - 4)}`
      : '*'.repeat(apiKey.length);

    console.log(chalk.cyan('API Key:'), masked);
    console.log(chalk.gray(`Config file: ${CONFIG_FILE}`));
  });

// Clear API key
command
  .command('clear')
  .description('Remove API key from config')
  .action(() => {
    setConfig('apiKey', null);
    console.log(chalk.green('✓ API key cleared'));
  });

module.exports = command;
