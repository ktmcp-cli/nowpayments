/**
 * Estimate command
 *
 * Calculate cryptocurrency price estimates and conversions.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { makeRequest, handleApiError, displayResponse } = require('../lib/api');

const command = new Command('estimate');

command
  .description('Estimate cryptocurrency amounts')
  .summary('Calculate price conversions and estimates');

// Estimate conversion
command
  .command('convert')
  .description('Estimate cryptocurrency amount for a given price')
  .requiredOption('-f, --from <currency>', 'Currency to convert from (e.g., USD, EUR)')
  .requiredOption('-t, --to <currency>', 'Cryptocurrency to convert to (e.g., BTC, ETH)')
  .requiredOption('-a, --amount <amount>', 'Amount to convert')
  .action(async (options) => {
    try {
      const amount = parseFloat(options.amount);

      if (isNaN(amount) || amount <= 0) {
        console.error(chalk.red('Error: Amount must be a positive number'));
        process.exit(1);
      }

      const data = await makeRequest(command.parent.parent, '/estimate', {
        queryParams: {
          amount,
          currency_from: options.from.toUpperCase(),
          currency_to: options.to.toUpperCase()
        }
      });

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.cyan('\nEstimate:'));
        console.log(chalk.bold(`  ${amount} ${options.from.toUpperCase()}`), '→',
                    chalk.green(`${response.estimated_amount || response.amount_to} ${options.to.toUpperCase()}`));

        if (response.fee_amount) {
          console.log(chalk.gray(`  Network fee: ${response.fee_amount} ${options.to.toUpperCase()}`));
        }
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// Get minimum amount
command
  .command('min')
  .description('Get minimum payment amount for a currency pair')
  .requiredOption('-f, --from <currency>', 'Currency from (e.g., USD)')
  .requiredOption('-t, --to <currency>', 'Cryptocurrency to (e.g., BTC)')
  .option('--fiat', 'Get fiat equivalent of minimum')
  .action(async (options) => {
    try {
      const data = await makeRequest(command.parent.parent, '/min-amount', {
        queryParams: {
          currency_from: options.from.toUpperCase(),
          currency_to: options.to.toUpperCase(),
          fiat_equivalent: options.fiat ? 'true' : undefined
        }
      });

      displayResponse(command.parent.parent, data, (response) => {
        console.log(chalk.cyan('\nMinimum Payment Amount:'));
        console.log(chalk.bold(`  ${response.min_amount} ${options.to.toUpperCase()}`));

        if (response.fiat_equivalent) {
          console.log(chalk.gray(`  ≈ ${response.fiat_equivalent} ${options.from.toUpperCase()}`));
        }
      });
    } catch (error) {
      handleApiError(error);
    }
  });

module.exports = command;
