import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  getStatus,
  getCurrencies,
  getEstimate,
  getMinAmount,
  listPayments,
  getPayment,
  createPayment,
  createInvoice,
  listInvoices,
  listPlans,
  getPlan,
  listSubscriptions
} from './api.js';

const program = new Command();

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('API key not configured.');
    console.log(chalk.cyan('  nowpaymentsio config set --api-key <key>'));
    process.exit(1);
  }
}

program
  .name('nowpaymentsio')
  .description(chalk.bold('NOWPayments CLI') + ' - Cryptocurrency payments from your terminal')
  .version('1.0.0');

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set API key')
  .option('--api-key <key>', 'NOWPayments API key')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      printSuccess(`API Key set`);
    } else {
      printError('Use --api-key');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    console.log(chalk.bold('\nNOWPayments CLI Configuration\n'));
    console.log('API Key: ', apiKey ? chalk.green('*'.repeat(8)) : chalk.red('not set'));
  });

const statusCmd = program.command('status').description('Check API status');

statusCmd
  .command('get')
  .description('Get API status')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Checking status...', () => getStatus());
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold('\nAPI Status\n'));
        console.log('Status: ', chalk.green(data.message || 'OK'));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

const currenciesCmd = program.command('currencies').description('Manage currencies');

currenciesCmd
  .command('list')
  .description('List available currencies')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching currencies...', () => getCurrencies());
      if (options.json) {
        printJson(data);
      } else {
        const currencies = data.currencies || [];
        console.log(chalk.bold(`\nAvailable Currencies (${currencies.length})\n`));
        currencies.forEach(c => console.log(`  ${c}`));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

currenciesCmd
  .command('estimate')
  .description('Get price estimate')
  .requiredOption('--amount <amount>', 'Amount')
  .requiredOption('--from <currency>', 'From currency')
  .requiredOption('--to <currency>', 'To currency')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Calculating estimate...', () =>
        getEstimate({ amount: options.amount, currency_from: options.from, currency_to: options.to })
      );
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold('\nEstimate\n'));
        console.log(`${options.amount} ${options.from} ≈ ${data.estimated_amount} ${options.to}`);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

const paymentsCmd = program.command('payments').description('Manage payments');

paymentsCmd
  .command('list')
  .description('List payments')
  .option('--limit <n>', 'Number of results', '10')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching payments...', () => listPayments({ limit: options.limit }));
      printJson(data);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

paymentsCmd
  .command('get <payment-id>')
  .description('Get payment details')
  .option('--json', 'Output as JSON')
  .action(async (paymentId, options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching payment...', () => getPayment(paymentId));
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold('\nPayment Details\n'));
        console.log('Payment ID:     ', chalk.cyan(data.payment_id));
        console.log('Status:         ', chalk.bold(data.payment_status));
        console.log('Amount:         ', data.pay_amount, data.pay_currency);
        console.log('Outcome Amount: ', data.outcome_amount, data.outcome_currency);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

paymentsCmd
  .command('create')
  .description('Create a payment')
  .requiredOption('--amount <amount>', 'Payment amount')
  .requiredOption('--from <currency>', 'Pay currency')
  .requiredOption('--to <currency>', 'Outcome currency')
  .option('--order-id <id>', 'Order ID')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const paymentData = {
        price_amount: parseFloat(options.amount),
        price_currency: options.from,
        pay_currency: options.to,
        order_id: options.orderId || `order-${Date.now()}`
      };
      const data = await withSpinner('Creating payment...', () => createPayment(paymentData));
      if (options.json) {
        printJson(data);
      } else {
        printSuccess(`Payment created: ${chalk.bold(data.payment_id)}`);
        console.log('Pay Address: ', chalk.cyan(data.pay_address));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

const invoicesCmd = program.command('invoices').description('Manage invoices');

invoicesCmd
  .command('list')
  .description('List invoices')
  .option('--limit <n>', 'Number of results', '10')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching invoices...', () => listInvoices({ limit: options.limit }));
      printJson(data);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

invoicesCmd
  .command('create')
  .description('Create an invoice')
  .requiredOption('--amount <amount>', 'Invoice amount')
  .requiredOption('--currency <currency>', 'Currency')
  .option('--order-id <id>', 'Order ID')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const invoiceData = {
        price_amount: parseFloat(options.amount),
        price_currency: options.currency,
        order_id: options.orderId || `invoice-${Date.now()}`
      };
      const data = await withSpinner('Creating invoice...', () => createInvoice(invoiceData));
      if (options.json) {
        printJson(data);
      } else {
        printSuccess(`Invoice created: ${chalk.bold(data.id)}`);
        console.log('Invoice URL: ', chalk.cyan(data.invoice_url));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

const subscriptionsCmd = program.command('subscriptions').description('Manage subscriptions');

subscriptionsCmd
  .command('plans')
  .description('List subscription plans')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching plans...', () => listPlans());
      printJson(data);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

subscriptionsCmd
  .command('list')
  .description('List subscriptions')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching subscriptions...', () => listSubscriptions());
      printJson(data);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
