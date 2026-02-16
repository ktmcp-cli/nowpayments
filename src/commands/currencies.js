/**
 * Currencies command
 *
 * List and query available cryptocurrencies.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const { makeRequest, handleApiError, displayResponse } = require('../lib/api');

const command = new Command('currencies');

command
  .description('List available currencies')
  .summary('Query supported cryptocurrencies');

// List all available currencies
command
  .command('list')
  .description('List all available cryptocurrencies')
  .option('-a, --available', 'Show only available currencies for payments')
  .option('-s, --selected', 'Show only selected currencies')
  .action(async (options) => {
    try {
      let endpoint = '/currencies';

      if (options.available) {
        endpoint = '/merchant/coins';
      } else if (options.selected) {
        endpoint = '/currencies?fixed_rate=true';
      }

      const data = await makeRequest(command.parent.parent, endpoint);

      displayResponse(command.parent.parent, data, (response) => {
        const currencies = response.selectedCurrencies || response.currencies || [];

        if (!currencies || currencies.length === 0) {
          console.log(chalk.yellow('No currencies found'));
          return;
        }

        console.log(chalk.cyan(`\nAvailable Currencies: ${currencies.length}`));

        // Display as formatted list
        const columns = 4;
        for (let i = 0; i < currencies.length; i += columns) {
          const row = currencies.slice(i, i + columns);
          console.log('  ' + row.map(c => chalk.bold(c.toUpperCase())).join('  '));
        }
      });
    } catch (error) {
      handleApiError(error);
    }
  });

// Get currency details
command
  .command('info <currency>')
  .description('Get information about a specific currency')
  .action(async (currency) => {
    try {
      // First get all currencies
      const data = await makeRequest(command.parent.parent, '/currencies');

      const currencies = data.currencies || [];
      const currencyUpper = currency.toUpperCase();

      if (currencies.includes(currencyUpper.toLowerCase())) {
        console.log(chalk.cyan('\nCurrency:'), chalk.bold(currencyUpper));
        console.log(chalk.green('✓ Supported by NOWPayments'));

        // Get minimum amount
        try {
          const minData = await makeRequest(command.parent.parent, '/min-amount', {
            queryParams: { currency_from: 'USD', currency_to: currencyUpper }
          });

          if (minData.min_amount) {
            console.log(chalk.cyan('Minimum amount:'), minData.min_amount, currencyUpper);
          }
        } catch (e) {
          // Minimum amount not available
        }
      } else {
        console.log(chalk.red(`\n✗ Currency ${currencyUpper} is not supported`));
        process.exit(1);
      }
    } catch (error) {
      handleApiError(error);
    }
  });

module.exports = command;
