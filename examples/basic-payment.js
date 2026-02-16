#!/usr/bin/env node

/**
 * Basic Payment Example
 *
 * Demonstrates creating a simple cryptocurrency payment with NOWPayments CLI.
 */

const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function createBasicPayment() {
  console.log('Creating a basic payment...\n');

  try {
    // Step 1: Check API status
    console.log('1. Checking API status...');
    await execPromise('nowpayments status');
    console.log('   ✓ API is online\n');

    // Step 2: Get estimate
    console.log('2. Getting price estimate...');
    const estimateResult = await execPromise(
      'nowpayments --json estimate convert --from USD --to BTC --amount 100'
    );
    const estimate = JSON.parse(estimateResult.stdout);
    console.log(`   ✓ $100 USD ≈ ${estimate.estimated_amount} BTC\n`);

    // Step 3: Create payment
    console.log('3. Creating payment...');
    const paymentResult = await execPromise(`
      nowpayments --json payment create \
        --price 100 \
        --currency USD \
        --pay-currency BTC \
        --order-id "DEMO-${Date.now()}" \
        --order-description "Basic payment example"
    `);
    const payment = JSON.parse(paymentResult.stdout);

    console.log('   ✓ Payment created successfully!\n');
    console.log('Payment Details:');
    console.log(`  Payment ID: ${payment.payment_id}`);
    console.log(`  Status: ${payment.payment_status}`);
    console.log(`  Pay Amount: ${payment.pay_amount} ${payment.pay_currency}`);
    console.log(`  Pay Address: ${payment.pay_address}`);
    console.log(`  Created: ${new Date(payment.created_at).toLocaleString()}\n`);

    // Step 4: Check payment status
    console.log('4. Checking payment status...');
    const statusResult = await execPromise(
      `nowpayments --json payment get ${payment.payment_id}`
    );
    const status = JSON.parse(statusResult.stdout);
    console.log(`   Status: ${status.payment_status}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
createBasicPayment();
