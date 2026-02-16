#!/usr/bin/env node

/**
 * Payment Monitoring Example
 *
 * Demonstrates monitoring a payment until completion or timeout.
 */

const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_DURATION = 30 * 60 * 1000; // 30 minutes

async function monitorPayment(paymentId) {
  const startTime = Date.now();

  console.log(`Monitoring payment: ${paymentId}`);
  console.log(`Check interval: ${CHECK_INTERVAL / 1000}s`);
  console.log(`Max duration: ${MAX_DURATION / 60000} minutes\n`);

  while (Date.now() - startTime < MAX_DURATION) {
    try {
      // Check payment status
      const result = await execPromise(
        `nowpayments --json payment get ${paymentId}`
      );
      const payment = JSON.parse(result.stdout);

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`[${elapsed}s] Status: ${payment.payment_status}`);

      // Check for terminal states
      switch (payment.payment_status) {
        case 'finished':
          console.log('\n✓ Payment completed successfully!');
          console.log(`  Amount paid: ${payment.actually_paid} ${payment.pay_currency}`);
          console.log(`  Outcome: ${payment.outcome_amount} ${payment.outcome_currency}`);
          return { success: true, payment };

        case 'failed':
          console.log('\n✗ Payment failed');
          return { success: false, reason: 'failed', payment };

        case 'expired':
          console.log('\n✗ Payment expired');
          return { success: false, reason: 'expired', payment };

        case 'partially_paid':
          console.log(`\n⚠ Partially paid: ${payment.actually_paid}/${payment.pay_amount} ${payment.pay_currency}`);
          // Continue monitoring
          break;

        case 'waiting':
        case 'confirming':
        case 'confirmed':
        case 'sending':
          // Still processing, continue monitoring
          break;
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));

    } catch (error) {
      console.error(`Error checking payment: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }

  console.log('\n⏱ Monitoring timeout reached');
  return { success: false, reason: 'timeout' };
}

// Get payment ID from command line
const paymentId = process.argv[2];

if (!paymentId) {
  console.error('Usage: node monitor-payment.js <payment_id>');
  process.exit(1);
}

// Run monitoring
monitorPayment(paymentId)
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
