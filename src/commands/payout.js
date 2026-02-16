/**
 * Payout command
 *
 * Create and manage cryptocurrency payouts/withdrawals.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const { makeRequest, handleApiError, displayResponse } = require('../lib/api');

const command = new Command('payout');

command
  .description('Manage payouts and withdrawals')
  .summary('Create and query payout transactions');

// Create a new payout
command
  .command('create')
  .description('Create a new payout/withdrawal')
  .requiredOption('-a, --amount <amount>', 'Payout amount')
  .requiredOption('-c, --currency <currency>', 'Cryptocurrency (e.g., BTC)')
  .requiredOption('--address <address>', 'Destination wallet address')
  .option('--ipn-url <url>', 'IPN callback URL')
  .option('--extra-id <id>', 'Extra ID for currencies that require it (e.g., XRP destination tag)')
  .action(async (options) => {
    try {
      const amount = parseFloat(options.amount);

      if (isNaN(amount) || amount <= 0) {
        console.error(chalk.red('Error: Amount must be a positive number'));
        process.exit(1);
      }

      const payoutData = {
        withdrawals: [{
          address: options.address,
          currency: options.currency.toUpperCase(),
          amount: amount,
          ipn_callback_url: options.ipnUrl,
          extra_id: options.extraId
        }]
      };

      const data = await makeRequest(command.parent.parent, '/payout', {
        method: 'POST',
        body: payoutData
      });

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.green('\n✓ Payout created successfully'));
        console.log(chalk.cyan('\nPayout Details:'));

        if (response.withdrawals && response.withdrawals.length > 0) {
          const payout = response.withdrawals[0];
          console.log(chalk.bold('  Payout ID:'), payout.id);
          console.log(chalk.bold('  Status:'), payout.status);
          console.log(chalk.bold('  Amount:'), `${payout.amount} ${payout.currency}`);
          console.log(chalk.bold('  Address:'), payout.address);

          if (payout.extra_id) {
            console.log(chalk.bold('  Extra ID:'), payout.extra_id);
          }
        }

        console.log(chalk.yellow('\n⚠ Note: Some payouts may require 2FA verification'));
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// Verify payout (2FA)
command
  .command('verify <payout-id> <verification-code>')
  .description('Verify a payout with 2FA code')
  .action(async (payoutId, code) => {
    try {
      const data = await makeRequest(command.parent.parent, `/payout/${payoutId}/verify`, {
        method: 'POST',
        body: { verification_code: code }
      });

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.green('\n✓ Payout verified successfully'));
        console.log(chalk.cyan('\nStatus:'), response.status || 'Verified');
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// Get payout details
command
  .command('get <payout-id>')
  .description('Get payout details by ID')
  .action(async (payoutId) => {
    try {
      const data = await makeRequest(command.parent.parent, `/payout/${payoutId}`);

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.cyan('\nPayout Details:'));

        const table = new Table({
          chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
        });

        table.push(
          ['Payout ID', response.id],
          ['Status', response.status],
          ['Amount', `${response.amount} ${response.currency}`],
          ['Address', response.address]
        );

        if (response.extra_id) {
          table.push(['Extra ID', response.extra_id]);
        }

        if (response.hash) {
          table.push(['Transaction Hash', response.hash]);
        }

        table.push(
          ['Created', new Date(response.created_at).toLocaleString()]
        );

        console.log(table.toString());
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// List payouts
command
  .command('list')
  .description('List all payouts')
  .option('-l, --limit <number>', 'Number of payouts to return', '10')
  .option('-p, --page <number>', 'Page number', '0')
  .action(async (options) => {
    try {
      const queryParams = {
        limit: parseInt(options.limit),
        page: parseInt(options.page)
      };

      const data = await makeRequest(command.parent.parent, '/payout', {
        queryParams
      });

      displayResponse(command.parent.parent, data, (response) => {
        const payouts = response.data || [];

        if (payouts.length === 0) {
          console.log(chalk.yellow('\nNo payouts found'));
          return;
        }

        console.log(chalk.cyan(`\nPayouts (${payouts.length}):`));

        const table = new Table({
          head: ['ID', 'Status', 'Amount', 'Currency', 'Created'],
          colWidths: [20, 15, 15, 10, 25]
        });

        payouts.forEach(payout => {
          table.push([
            payout.id?.toString().substring(0, 18) || 'N/A',
            payout.status || 'N/A',
            payout.amount || 'N/A',
            payout.currency || 'N/A',
            new Date(payout.created_at).toLocaleString()
          ]);
        });

        console.log(table.toString());
      });
    } catch (error) {
      handleApiError(error);
    }
  });

module.exports = command;
