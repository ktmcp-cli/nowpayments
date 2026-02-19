import axios from 'axios';
import { getConfig } from './config.js';

const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

async function apiRequest(method, endpoint, data = null, params = null) {
  const apiKey = getConfig('apiKey');

  if (!apiKey) {
    throw new Error('API key not configured. Run: nowpaymentsio config set --api-key <key>');
  }

  const config = {
    method,
    url: `${NOWPAYMENTS_BASE_URL}${endpoint}`,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  };

  if (params) config.params = params;
  if (data) config.data = data;

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      if (status === 401) {
        throw new Error('Authentication failed. Check your API key.');
      } else if (status === 404) {
        throw new Error('Resource not found.');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded.');
      } else {
        const message = data?.message || JSON.stringify(data);
        throw new Error(`API Error (${status}): ${message}`);
      }
    } else {
      throw error;
    }
  }
}

export async function getStatus() {
  return await apiRequest('GET', '/status');
}

export async function getCurrencies() {
  return await apiRequest('GET', '/currencies');
}

export async function getEstimate(params) {
  return await apiRequest('GET', '/estimate', null, params);
}

export async function getMinAmount(params) {
  return await apiRequest('GET', '/min-amount', null, params);
}

export async function listPayments(params = {}) {
  return await apiRequest('GET', '/payment/', null, params);
}

export async function getPayment(paymentId) {
  return await apiRequest('GET', `/payment/${paymentId}`);
}

export async function createPayment(data) {
  return await apiRequest('POST', '/payment', data);
}

export async function createInvoice(data) {
  return await apiRequest('POST', '/invoice', data);
}

export async function listInvoices(params = {}) {
  return await apiRequest('GET', '/invoice', null, params);
}

export async function listPlans(params = {}) {
  return await apiRequest('GET', '/subscriptions/plans', null, params);
}

export async function getPlan(planId) {
  return await apiRequest('GET', `/subscriptions/plans/${planId}`);
}

export async function listSubscriptions(params = {}) {
  return await apiRequest('GET', '/subscriptions', null, params);
}
