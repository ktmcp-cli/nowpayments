/**
 * API client for NOWPayments
 *
 * Handles all HTTP requests to the NOWPayments API with proper error handling,
 * authentication, and response formatting.
 */

const fetch = require('node-fetch');
const chalk = require('chalk');
const { getBaseUrl } = require('./config');
const { getAuthHeaders } = require('./auth');

/**
 * Make an API request to NOWPayments
 * @param {Object} program - Commander program instance
 * @param {string} endpoint - API endpoint (e.g., '/status')
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {Object} options.body - Request body for POST/PUT requests
 * @param {Object} options.queryParams - URL query parameters
 * @returns {Promise<Object>} API response data
 */
async function makeRequest(program, endpoint, options = {}) {
  const { method = 'GET', body = null, queryParams = {} } = options;

  // Build URL
  const baseUrl = getBaseUrl(program._sandbox);
  const url = new URL(`${baseUrl}${endpoint}`);

  // Add query parameters
  Object.keys(queryParams).forEach(key => {
    if (queryParams[key] !== undefined && queryParams[key] !== null) {
      url.searchParams.append(key, queryParams[key]);
    }
  });

  // Build request options
  const requestOptions = {
    method,
    headers: getAuthHeaders(program)
  };

  // Add body for POST/PUT requests
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body);
  }

  if (program._debug) {
    console.log(chalk.gray(`[DEBUG] ${method} ${url.toString()}`));
    if (body) {
      console.log(chalk.gray(`[DEBUG] Body: ${JSON.stringify(body, null, 2)}`));
    }
  }

  try {
    const response = await fetch(url.toString(), requestOptions);
    const data = await response.json();

    if (program._debug) {
      console.log(chalk.gray(`[DEBUG] Status: ${response.status}`));
      console.log(chalk.gray(`[DEBUG] Response: ${JSON.stringify(data, null, 2)}`));
    }

    // Handle error responses
    if (!response.ok) {
      const error = new Error(data.message || `API request failed with status ${response.status}`);
      error.statusCode = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.statusCode) {
      // API error
      throw error;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // Network error
      const networkError = new Error('Network error: Unable to reach NOWPayments API');
      networkError.originalError = error;
      throw networkError;
    } else {
      // Other error (parsing, etc.)
      throw error;
    }
  }
}

/**
 * Handle and format API errors for display
 * @param {Error} error - Error object
 */
function handleApiError(error) {
  if (error.statusCode) {
    console.error(chalk.red(`\nAPI Error (${error.statusCode}):`));
    console.error(chalk.yellow(error.message));

    if (error.data && error.data.errors) {
      console.error(chalk.yellow('\nDetails:'));
      console.error(JSON.stringify(error.data.errors, null, 2));
    }
  } else if (error.originalError) {
    console.error(chalk.red('\nNetwork Error:'));
    console.error(chalk.yellow(error.message));
  } else {
    console.error(chalk.red('\nUnexpected Error:'));
    console.error(chalk.yellow(error.message));
  }

  process.exit(1);
}

/**
 * Format and display API response
 * @param {Object} program - Commander program instance
 * @param {Object} data - Response data
 * @param {Function} formatter - Optional custom formatter function
 */
function displayResponse(program, data, formatter = null) {
  if (program._json) {
    console.log(JSON.stringify(data, null, 2));
  } else if (formatter) {
    formatter(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

module.exports = {
  makeRequest,
  handleApiError,
  displayResponse
};
