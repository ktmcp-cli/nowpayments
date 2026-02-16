#!/usr/bin/env node

/**
 * Invoice Flow Example
 *
 * Demonstrates creating and managing payment invoices.
 */

const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function createInvoiceFlow() {
  console.log('Creating payment invoice...\n');

  try {
    // Step 1: Create invoice
    console.log('1. Creating invoice...');
    const invoiceResult = await execPromise(`
      nowpayments --json invoice create \
        --price 49.99 \
        --currency USD \
        --order-id "INV-${Date.now()}" \
        --order-description "Premium subscription" \
        --success-url "https://example.com/success" \
        --cancel-url "https://example.com/cancel"
    `);
    const invoice = JSON.parse(invoiceResult.stdout);

    console.log('   ✓ Invoice created!\n');
    console.log('Invoice Details:');
    console.log(`  Invoice ID: ${invoice.id}`);
    console.log(`  Status: ${invoice.invoice_status}`);
    console.log(`  Amount: $${invoice.price_amount} ${invoice.price_currency}`);
    console.log(`  Invoice URL: ${invoice.invoice_url}`);
    console.log(`  Created: ${new Date(invoice.created_at).toLocaleString()}\n`);

    console.log('Share this URL with your customer:');
    console.log(`  ${invoice.invoice_url}\n`);

    // Step 2: Check invoice status
    console.log('2. Checking invoice status...');
    const statusResult = await execPromise(
      `nowpayments --json invoice get ${invoice.id}`
    );
    const status = JSON.parse(statusResult.stdout);

    console.log(`   Status: ${status.invoice_status}`);

    if (status.payment_id) {
      console.log(`   Payment ID: ${status.payment_id}`);
    }

    // Step 3: List recent invoices
    console.log('\n3. Listing recent invoices...');
    const listResult = await execPromise(
      'nowpayments --json invoice list --limit 5'
    );
    const list = JSON.parse(listResult.stdout);

    console.log(`   Found ${list.data.length} invoices:\n`);
    list.data.forEach((inv, i) => {
      console.log(`   ${i + 1}. ${inv.id}`);
      console.log(`      Status: ${inv.invoice_status}`);
      console.log(`      Amount: $${inv.price_amount}`);
      console.log(`      Created: ${new Date(inv.created_at).toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
createInvoiceFlow();
