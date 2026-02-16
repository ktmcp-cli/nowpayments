/**
 * Invoice command
 *
 * Create and manage payment invoices.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const { makeRequest, handleApiError, displayResponse } = require('../lib/api');

const command = new Command('invoice');

command
  .description('Manage invoices')
  .summary('Create and query payment invoices');

// Create a new invoice
command
  .command('create')
  .description('Create a new invoice')
  .requiredOption('-p, --price <amount>', 'Invoice amount')
  .requiredOption('-c, --currency <currency>', 'Price currency (e.g., USD)')
  .option('--order-id <id>', 'Your order ID')
  .option('--order-description <desc>', 'Order description')
  .option('--ipn-url <url>', 'IPN callback URL')
  .option('--success-url <url>', 'Success redirect URL')
  .option('--cancel-url <url>', 'Cancel redirect URL')
  .option('--partially-paid-url <url>', 'Partially paid redirect URL')
  .option('--payout-currency <currency>', 'Payout currency')
  .option('--payout-address <address>', 'Payout address')
  .action(async (options) => {
    try {
      const price = parseFloat(options.price);

      if (isNaN(price) || price <= 0) {
        console.error(chalk.red('Error: Price must be a positive number'));
        process.exit(1);
      }

      const invoiceData = {
        price_amount: price,
        price_currency: options.currency.toUpperCase(),
        order_id: options.orderId,
        order_description: options.orderDescription,
        ipn_callback_url: options.ipnUrl,
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        partially_paid_url: options.partiallyPaidUrl,
        payout_currency: options.payoutCurrency?.toUpperCase(),
        payout_address: options.payoutAddress
      };

      // Remove undefined values
      Object.keys(invoiceData).forEach(key => {
        if (invoiceData[key] === undefined) {
          delete invoiceData[key];
        }
      });

      const data = await makeRequest(command.parent.parent, '/invoice', {
        method: 'POST',
        body: invoiceData
      });

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.green('\n✓ Invoice created successfully'));
        console.log(chalk.cyan('\nInvoice Details:'));
        console.log(chalk.bold('  Invoice ID:'), response.id);
        console.log(chalk.bold('  Status:'), response.invoice_status);
        console.log(chalk.bold('  Price:'), `${response.price_amount} ${response.price_currency}`);
        console.log(chalk.bold('  Invoice URL:'), chalk.yellow(response.invoice_url));

        if (response.order_id) {
          console.log(chalk.bold('  Order ID:'), response.order_id);
        }

        console.log(chalk.gray('\n  Created:'), new Date(response.created_at).toLocaleString());
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// Get invoice details
command
  .command('get <invoice-id>')
  .description('Get invoice details by ID')
  .action(async (invoiceId) => {
    try {
      const data = await makeRequest(command.parent.parent, `/invoice/${invoiceId}`);

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.cyan('\nInvoice Details:'));

        const table = new Table({
          chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
        });

        table.push(
          ['Invoice ID', response.id],
          ['Status', response.invoice_status],
          ['Price', `${response.price_amount} ${response.price_currency}`],
          ['Invoice URL', response.invoice_url]
        );

        if (response.order_id) {
          table.push(['Order ID', response.order_id]);
        }

        if (response.order_description) {
          table.push(['Description', response.order_description]);
        }

        if (response.payment_id) {
          table.push(['Payment ID', response.payment_id]);
        }

        table.push(
          ['Created', new Date(response.created_at).toLocaleString()],
          ['Updated', new Date(response.updated_at).toLocaleString()]
        );

        console.log(table.toString());
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// List invoices
command
  .command('list')
  .description('List all invoices')
  .option('-l, --limit <number>', 'Number of invoices to return', '10')
  .option('-p, --page <number>', 'Page number', '0')
  .option('--sort-by <field>', 'Sort by field (created_at, updated_at)')
  .option('--order <order>', 'Sort order (asc, desc)', 'desc')
  .option('--date-from <date>', 'Filter by start date (YYYY-MM-DD)')
  .option('--date-to <date>', 'Filter by end date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      const queryParams = {
        limit: parseInt(options.limit),
        page: parseInt(options.page),
        sortBy: options.sortBy,
        orderBy: options.order,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo
      };

      const data = await makeRequest(command.parent.parent, '/invoice', {
        queryParams
      });

      displayResponse(command.parent.parent, data, (response) => {
        const invoices = response.data || [];

        if (invoices.length === 0) {
          console.log(chalk.yellow('\nNo invoices found'));
          return;
        }

        console.log(chalk.cyan(`\nInvoices (${invoices.length}):`));

        const table = new Table({
          head: ['ID', 'Status', 'Amount', 'Currency', 'Created'],
          colWidths: [20, 15, 12, 10, 25]
        });

        invoices.forEach(invoice => {
          table.push([
            invoice.id?.toString().substring(0, 18) || 'N/A',
            invoice.invoice_status || 'N/A',
            invoice.price_amount || 'N/A',
            invoice.price_currency || 'N/A',
            new Date(invoice.created_at).toLocaleString()
          ]);
        });

        console.log(table.toString());
      });
    } catch (error) {
      handleApiError(error);
    }
  });

module.exports = command;
