#!/usr/bin/env node

/**
 * NOWPayments CLI Entry Point
 *
 * A production-ready command-line interface for the NOWPayments cryptocurrency
 * payment processing API.
 *
 * @see https://documenter.getpostman.com/view/7907941/S1a32n38
 */

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const program = new Command();

// Import commands
const statusCommand = require('../src/commands/status');
const currenciesCommand = require('../src/commands/currencies');
const estimateCommand = require('../src/commands/estimate');
const paymentCommand = require('../src/commands/payment');
const invoiceCommand = require('../src/commands/invoice');
const payoutCommand = require('../src/commands/payout');
const authCommand = require('../src/commands/auth');

// CLI metadata
program
  .name('nowpayments')
  .description('NOWPayments API CLI - Cryptocurrency payment processing from the command line')
  .version('1.0.0')
  .option('-k, --api-key <key>', 'NOWPayments API key (or set NOWPAYMENTS_API_KEY env var)')
  .option('--sandbox', 'Use sandbox environment (sandbox.nowpayments.io)')
  .option('--json', 'Output raw JSON responses')
  .option('--debug', 'Enable debug logging')
  .hook('preAction', (thisCommand, actionCommand) => {
    // Make global options available to all commands
    const opts = thisCommand.opts();
    program._apiKey = opts.apiKey || process.env.NOWPAYMENTS_API_KEY;
    program._sandbox = opts.sandbox || false;
    program._json = opts.json || false;
    program._debug = opts.debug || false;

    if (program._debug) {
      console.log(chalk.gray(`[DEBUG] Command: ${actionCommand.name()}`));
      console.log(chalk.gray(`[DEBUG] Sandbox: ${program._sandbox}`));
    }
  });

// Register commands
program.addCommand(authCommand);
program.addCommand(statusCommand);
program.addCommand(currenciesCommand);
program.addCommand(estimateCommand);
program.addCommand(paymentCommand);
program.addCommand(invoiceCommand);
program.addCommand(payoutCommand);

// Display helpful message when no command is provided
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ nowpayments status');
  console.log('  $ nowpayments currencies --available');
  console.log('  $ nowpayments estimate --from USD --to BTC --amount 100');
  console.log('  $ nowpayments payment create --price 99.99 --currency USD --pay-currency BTC');
  console.log('  $ nowpayments payment get <payment_id>');
  console.log('');
  console.log('Authentication:');
  console.log('  Set NOWPAYMENTS_API_KEY in .env file or use --api-key flag');
  console.log('  $ nowpayments auth set YOUR_API_KEY');
  console.log('');
  console.log('Documentation:');
  console.log('  README.md - General usage and examples');
  console.log('  AGENT.md - AI agent integration patterns');
  console.log('  OPENCLAW.md - OpenClaw integration guide');
});

// Parse and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
