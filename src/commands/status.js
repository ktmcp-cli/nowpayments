/**
 * Status command
 *
 * Check API status and availability.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { makeRequest, handleApiError, displayResponse } = require('../lib/api');

const command = new Command('status');

command
  .description('Check NOWPayments API status')
  .summary('Verify API connectivity and status')
  .action(async () => {
    try {
      const data = await makeRequest(command.parent, '/status');

      displayResponse(command.parent, data, (response) => {
        console.log(chalk.green('✓ NOWPayments API is'), chalk.bold(response.message || 'OK'));
      });
    } catch (error) {
      handleApiError(error);
    }
  });

module.exports = command;
