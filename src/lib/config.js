/**
 * Configuration management for NOWPayments CLI
 *
 * Handles API keys, environment selection, and persistent configuration.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.nowpayments');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  apiKey: null,
  sandbox: false,
  defaultCurrency: 'USD',
  defaultPayCurrency: 'BTC'
};

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration from file
 * @returns {Object} Configuration object
 */
function loadConfig() {
  try {
    ensureConfigDir();
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    // Return defaults if config file doesn't exist or is invalid
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save configuration to file
 * @param {Object} config - Configuration to save
 */
function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Get a configuration value
 * @param {string} key - Configuration key
 * @returns {*} Configuration value
 */
function getConfig(key) {
  const config = loadConfig();
  return config[key];
}

/**
 * Set a configuration value
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 */
function setConfig(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

/**
 * Get API key from config, environment, or command option
 * @param {Object} program - Commander program instance
 * @returns {string|null} API key
 */
function getApiKey(program) {
  // Priority: command option > environment > config file
  return program._apiKey || process.env.NOWPAYMENTS_API_KEY || getConfig('apiKey');
}

/**
 * Get base URL based on environment
 * @param {boolean} sandbox - Whether to use sandbox environment
 * @returns {string} Base URL
 */
function getBaseUrl(sandbox = false) {
  return sandbox
    ? 'https://api-sandbox.nowpayments.io/v1'
    : 'https://api.nowpayments.io/v1';
}

module.exports = {
  CONFIG_DIR,
  CONFIG_FILE,
  loadConfig,
  saveConfig,
  getConfig,
  setConfig,
  getApiKey,
  getBaseUrl
};
