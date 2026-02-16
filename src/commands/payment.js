/**
 * Payment command
 *
 * Create and manage cryptocurrency payments.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const { makeRequest, handleApiError, displayResponse } = require('../lib/api');

const command = new Command('payment');

command
  .description('Manage payments')
  .summary('Create and query payment transactions');

// Create a new payment
command
  .command('create')
  .description('Create a new payment')
  .requiredOption('-p, --price <amount>', 'Price amount')
  .requiredOption('-c, --currency <currency>', 'Price currency (e.g., USD)')
  .requiredOption('--pay-currency <currency>', 'Cryptocurrency to receive (e.g., BTC)')
  .option('--ipn-url <url>', 'IPN callback URL')
  .option('--order-id <id>', 'Your order ID')
  .option('--order-description <desc>', 'Order description')
  .option('--purchase-id <id>', 'Purchase ID')
  .option('--payout-address <address>', 'Payout address')
  .option('--payout-currency <currency>', 'Payout currency')
  .option('--payout-extra-id <id>', 'Payout extra ID (for currencies that require it)')
  .option('--fixed-rate', 'Use fixed rate')
  .action(async (options) => {
    try {
      const price = parseFloat(options.price);

      if (isNaN(price) || price <= 0) {
        console.error(chalk.red('Error: Price must be a positive number'));
        process.exit(1);
      }

      const paymentData = {
        price_amount: price,
        price_currency: options.currency.toUpperCase(),
        pay_currency: options.payCurrency.toUpperCase(),
        ipn_callback_url: options.ipnUrl,
        order_id: options.orderId,
        order_description: options.orderDescription,
        purchase_id: options.purchaseId,
        payout_address: options.payoutAddress,
        payout_currency: options.payoutCurrency?.toUpperCase(),
        payout_extra_id: options.payoutExtraId,
        fixed_rate: options.fixedRate || false
      };

      // Remove undefined values
      Object.keys(paymentData).forEach(key => {
        if (paymentData[key] === undefined) {
          delete paymentData[key];
        }
      });

      const data = await makeRequest(command.parent.parent, '/payment', {
        method: 'POST',
        body: paymentData
      });

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.green('\n✓ Payment created successfully'));
        console.log(chalk.cyan('\nPayment Details:'));
        console.log(chalk.bold('  Payment ID:'), response.payment_id);
        console.log(chalk.bold('  Status:'), getStatusColor(response.payment_status));
        console.log(chalk.bold('  Pay Address:'), chalk.yellow(response.pay_address));
        console.log(chalk.bold('  Pay Amount:'), `${response.pay_amount} ${response.pay_currency}`);
        console.log(chalk.bold('  Price:'), `${response.price_amount} ${response.price_currency}`);

        if (response.order_id) {
          console.log(chalk.bold('  Order ID:'), response.order_id);
        }

        console.log(chalk.gray('\n  Created:'), new Date(response.created_at).toLocaleString());

        if (response.expiration_estimate_date) {
          console.log(chalk.gray('  Expires:'), new Date(response.expiration_estimate_date).toLocaleString());
        }
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// Get payment details
command
  .command('get <payment-id>')
  .description('Get payment details by ID')
  .action(async (paymentId) => {
    try {
      const data = await makeRequest(command.parent.parent, `/payment/${paymentId}`);

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.cyan('\nPayment Details:'));

        const table = new Table({
          chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
        });

        table.push(
          ['Payment ID', response.payment_id],
          ['Status', getStatusColor(response.payment_status)],
          ['Pay Address', response.pay_address],
          ['Pay Amount', `${response.pay_amount} ${response.pay_currency}`],
          ['Price', `${response.price_amount} ${response.price_currency}`],
          ['Actually Paid', response.actually_paid ? `${response.actually_paid} ${response.pay_currency}` : 'N/A']
        );

        if (response.outcome_amount) {
          table.push(['Outcome', `${response.outcome_amount} ${response.outcome_currency}`]);
        }

        if (response.order_id) {
          table.push(['Order ID', response.order_id]);
        }

        if (response.order_description) {
          table.push(['Description', response.order_description]);
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

// List payments
command
  .command('list')
  .description('List all payments')
  .option('-l, --limit <number>', 'Number of payments to return', '10')
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

      const data = await makeRequest(command.parent.parent, '/payment', {
        queryParams
      });

      displayResponse(command.parent.parent, data, (response) => {
        const payments = response.data || [];

        if (payments.length === 0) {
          console.log(chalk.yellow('\nNo payments found'));
          return;
        }

        console.log(chalk.cyan(`\nPayments (${payments.length}):`));

        const table = new Table({
          head: ['ID', 'Status', 'Amount', 'Currency', 'Created'],
          colWidths: [15, 15, 15, 10, 25]
        });

        payments.forEach(payment => {
          table.push([
            payment.payment_id?.toString().substring(0, 12) || 'N/A',
            getStatusColor(payment.payment_status),
            payment.pay_amount || 'N/A',
            payment.pay_currency || 'N/A',
            new Date(payment.created_at).toLocaleString()
          ]);
        });

        console.log(table.toString());
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// Update payment estimate
command
  .command('update-estimate <payment-id>')
  .description('Update merchant estimate for a payment')
  .action(async (paymentId) => {
    try {
      const data = await makeRequest(command.parent.parent, `/payment/${paymentId}/update-merchant-estimate`, {
        method: 'POST'
      });

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.green('\n✓ Estimate updated successfully'));
        console.log(chalk.cyan('\nUpdated Payment:'));
        console.log(chalk.bold('  Payment ID:'), response.payment_id);
        console.log(chalk.bold('  Status:'), getStatusColor(response.payment_status));
        console.log(chalk.bold('  New Pay Amount:'), `${response.pay_amount} ${response.pay_currency}`);
      });
    } catch (error) {
      handleApiError(error);
    }
  });

/**
 * Get colored status text
 * @param {string} status - Payment status
 * @returns {string} Colored status
 */
function getStatusColor(status) {
  const colors = {
    'waiting': chalk.yellow,
    'confirming': chalk.cyan,
    'confirmed': chalk.blue,
    'sending': chalk.magenta,
    'partially_paid': chalk.yellow,
    'finished': chalk.green,
    'failed': chalk.red,
    'refunded': chalk.gray,
    'expired': chalk.red
  };

  const color = colors[status] || chalk.white;
  return color(status);
}

module.exports = command;
