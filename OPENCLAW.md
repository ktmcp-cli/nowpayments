# NOWPayments CLI - OpenClaw Integration Guide

This guide covers integration of the NOWPayments CLI with the OpenClaw agent framework, enabling cryptocurrency payment processing in OpenClaw-based applications.

## What is OpenClaw?

OpenClaw is an open-source agent framework for building autonomous AI applications. It provides:
- Multi-agent coordination
- Tool/skill registration
- Context management
- Session persistence
- Event-driven architecture

## Integration Overview

The NOWPayments CLI integrates with OpenClaw as a **tool/skill**, allowing OpenClaw agents to:
- Accept cryptocurrency payments
- Process invoices
- Manage payouts
- Monitor transaction status
- Handle payment webhooks

## Installation

### 1. Install NOWPayments CLI

```bash
npm install -g @ktmcp-cli/nowpayments
```

### 2. Configure API Key

```bash
# Set API key globally
nowpayments auth set YOUR_API_KEY

# Or use environment variable in OpenClaw config
export NOWPAYMENTS_API_KEY=your_api_key
```

### 3. Verify Installation

```bash
nowpayments status
```

## OpenClaw Skill Definition

Create a skill definition file for OpenClaw:

### `skills/nowpayments.json`

```json
{
  "name": "nowpayments",
  "version": "1.0.0",
  "description": "Cryptocurrency payment processing via NOWPayments",
  "category": "payment",
  "commands": {
    "status": {
      "description": "Check NOWPayments API status",
      "execute": "nowpayments status"
    },
    "list_currencies": {
      "description": "List available cryptocurrencies",
      "execute": "nowpayments --json currencies list --available",
      "output": "json"
    },
    "estimate": {
      "description": "Estimate cryptocurrency amount",
      "parameters": {
        "from": { "type": "string", "required": true },
        "to": { "type": "string", "required": true },
        "amount": { "type": "number", "required": true }
      },
      "execute": "nowpayments --json estimate convert --from {from} --to {to} --amount {amount}",
      "output": "json"
    },
    "create_payment": {
      "description": "Create a new payment",
      "parameters": {
        "price": { "type": "number", "required": true },
        "currency": { "type": "string", "required": true },
        "pay_currency": { "type": "string", "required": true },
        "order_id": { "type": "string", "required": false },
        "order_description": { "type": "string", "required": false }
      },
      "execute": "nowpayments --json payment create --price {price} --currency {currency} --pay-currency {pay_currency} {order_id:--order-id} {order_description:--order-description}",
      "output": "json"
    },
    "get_payment": {
      "description": "Get payment status and details",
      "parameters": {
        "payment_id": { "type": "string", "required": true }
      },
      "execute": "nowpayments --json payment get {payment_id}",
      "output": "json"
    },
    "list_payments": {
      "description": "List all payments",
      "parameters": {
        "limit": { "type": "number", "default": 10 },
        "page": { "type": "number", "default": 0 }
      },
      "execute": "nowpayments --json payment list --limit {limit} --page {page}",
      "output": "json"
    },
    "create_invoice": {
      "description": "Create a payment invoice",
      "parameters": {
        "price": { "type": "number", "required": true },
        "currency": { "type": "string", "required": true },
        "order_id": { "type": "string", "required": false },
        "success_url": { "type": "string", "required": false }
      },
      "execute": "nowpayments --json invoice create --price {price} --currency {currency} {order_id:--order-id} {success_url:--success-url}",
      "output": "json"
    }
  },
  "events": {
    "payment_created": {
      "description": "Emitted when a payment is created",
      "data": {
        "payment_id": "string",
        "pay_address": "string",
        "pay_amount": "number",
        "pay_currency": "string"
      }
    },
    "payment_completed": {
      "description": "Emitted when a payment is confirmed",
      "data": {
        "payment_id": "string",
        "status": "string"
      }
    }
  }
}
```

## Usage Examples

### Example 1: Simple Payment Flow

```javascript
// OpenClaw agent code
async function processPayment(agent, amount, currency) {
  // 1. Check API status
  const status = await agent.execute('nowpayments', 'status');
  if (!status.success) {
    throw new Error('NOWPayments API unavailable');
  }

  // 2. Get estimate
  const estimate = await agent.execute('nowpayments', 'estimate', {
    from: currency,
    to: 'BTC',
    amount: amount
  });

  // 3. Create payment
  const payment = await agent.execute('nowpayments', 'create_payment', {
    price: amount,
    currency: currency,
    pay_currency: 'BTC',
    order_id: `ORDER-${Date.now()}`,
    order_description: 'Product purchase'
  });

  // 4. Emit event
  agent.emit('payment_created', payment);

  // 5. Return payment details
  return {
    paymentId: payment.payment_id,
    address: payment.pay_address,
    amount: payment.pay_amount,
    currency: payment.pay_currency
  };
}
```

### Example 2: Payment Monitoring

```javascript
// Monitor payment status
async function monitorPayment(agent, paymentId) {
  const maxAttempts = 60; // 30 minutes (30s intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const payment = await agent.execute('nowpayments', 'get_payment', {
      payment_id: paymentId
    });

    switch (payment.payment_status) {
      case 'finished':
        agent.emit('payment_completed', {
          payment_id: paymentId,
          status: 'completed'
        });
        return { success: true, payment };

      case 'failed':
      case 'expired':
        agent.emit('payment_failed', {
          payment_id: paymentId,
          status: payment.payment_status
        });
        return { success: false, payment };

      case 'partially_paid':
        agent.emit('payment_underpaid', {
          payment_id: paymentId,
          expected: payment.pay_amount,
          received: payment.actually_paid
        });
        break;
    }

    // Wait 30 seconds before next check
    await agent.sleep(30000);
    attempts++;
  }

  return { success: false, timeout: true };
}
```

### Example 3: Invoice Generation

```javascript
// Generate and track invoice
async function createInvoice(agent, productId, amount, customerEmail) {
  // Create invoice
  const invoice = await agent.execute('nowpayments', 'create_invoice', {
    price: amount,
    currency: 'USD',
    order_id: `INV-${productId}-${Date.now()}`,
    success_url: `https://example.com/success?product=${productId}`
  });

  // Store invoice in agent context
  await agent.context.set(`invoice:${invoice.id}`, {
    invoiceId: invoice.id,
    productId: productId,
    customerEmail: customerEmail,
    amount: amount,
    created: new Date(),
    url: invoice.invoice_url
  });

  // Send invoice to customer
  await agent.execute('email', 'send', {
    to: customerEmail,
    subject: 'Your Payment Invoice',
    body: `Please complete your payment: ${invoice.invoice_url}`
  });

  return invoice;
}
```

### Example 4: Multi-Currency Support

```javascript
// Let customer choose payment currency
async function createFlexiblePayment(agent, priceUSD) {
  // Get available currencies
  const currencies = await agent.execute('nowpayments', 'list_currencies');

  // Get estimates for popular currencies
  const options = await Promise.all([
    agent.execute('nowpayments', 'estimate', {
      from: 'USD',
      to: 'BTC',
      amount: priceUSD
    }),
    agent.execute('nowpayments', 'estimate', {
      from: 'USD',
      to: 'ETH',
      amount: priceUSD
    }),
    agent.execute('nowpayments', 'estimate', {
      from: 'USD',
      to: 'USDT',
      amount: priceUSD
    })
  ]);

  // Present options to user
  const choice = await agent.prompt('Choose payment currency:', [
    `Bitcoin: ${options[0].estimated_amount} BTC`,
    `Ethereum: ${options[1].estimated_amount} ETH`,
    `Tether: ${options[2].estimated_amount} USDT`
  ]);

  const selectedCurrency = ['BTC', 'ETH', 'USDT'][choice];

  // Create payment with selected currency
  return await agent.execute('nowpayments', 'create_payment', {
    price: priceUSD,
    currency: 'USD',
    pay_currency: selectedCurrency,
    order_id: `ORDER-${Date.now()}`
  });
}
```

## Event Handling

### Set Up Event Listeners

```javascript
// In OpenClaw agent initialization
agent.on('nowpayments:payment_created', async (data) => {
  console.log('Payment created:', data.payment_id);

  // Store payment in database
  await agent.db.payments.insert({
    paymentId: data.payment_id,
    address: data.pay_address,
    amount: data.pay_amount,
    currency: data.pay_currency,
    status: 'waiting',
    createdAt: new Date()
  });

  // Start monitoring
  agent.schedule('monitor_payment', {
    paymentId: data.payment_id
  });
});

agent.on('nowpayments:payment_completed', async (data) => {
  console.log('Payment completed:', data.payment_id);

  // Update database
  await agent.db.payments.update(
    { paymentId: data.payment_id },
    { status: 'completed', completedAt: new Date() }
  );

  // Fulfill order
  await agent.execute('order', 'fulfill', {
    paymentId: data.payment_id
  });

  // Send confirmation
  await agent.execute('notification', 'send', {
    type: 'payment_success',
    paymentId: data.payment_id
  });
});
```

## Webhook Integration

### Set Up IPN Handler

```javascript
// In your OpenClaw web server
app.post('/webhooks/nowpayments/ipn', async (req, res) => {
  const ipnData = req.body;

  // Verify IPN signature (HMAC-SHA512)
  const signature = req.headers['x-nowpayments-sig'];
  const isValid = verifyIpnSignature(ipnData, signature);

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process payment update
  const { payment_id, payment_status } = ipnData;

  // Emit event to OpenClaw agents
  await openclaw.broadcast('nowpayments:payment_update', {
    paymentId: payment_id,
    status: payment_status,
    data: ipnData
  });

  res.status(200).send('OK');
});

// IPN signature verification
function verifyIpnSignature(data, signature) {
  const crypto = require('crypto');
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

  const payload = JSON.stringify(data);
  const expectedSignature = crypto
    .createHmac('sha512', ipnSecret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}
```

## Advanced Patterns

### Pattern 1: Subscription Payments

```javascript
async function createSubscription(agent, plan, customerEmail) {
  const monthlyPrice = plan.price;

  // Create first payment
  const payment = await agent.execute('nowpayments', 'create_payment', {
    price: monthlyPrice,
    currency: 'USD',
    pay_currency: 'BTC',
    order_id: `SUB-${plan.id}-${Date.now()}`,
    order_description: `${plan.name} - Month 1`
  });

  // Schedule monthly reminders
  agent.schedule('subscription_renewal', {
    planId: plan.id,
    customerEmail: customerEmail,
    amount: monthlyPrice
  }, { cron: '0 0 1 * *' }); // First of every month

  return payment;
}
```

### Pattern 2: Batch Processing

```javascript
async function processMonthlyPayouts(agent) {
  // Get all pending payouts
  const payouts = await agent.db.payouts.find({ status: 'pending' });

  // Group by currency for efficiency
  const grouped = groupBy(payouts, 'currency');

  for (const [currency, items] of Object.entries(grouped)) {
    for (const item of items) {
      try {
        const payout = await agent.execute('nowpayments', 'create_payout', {
          amount: item.amount,
          currency: currency,
          address: item.address
        });

        await agent.db.payouts.update(
          { id: item.id },
          { status: 'processing', payoutId: payout.id }
        );

        // Rate limiting
        await agent.sleep(1000);
      } catch (error) {
        await agent.log.error('Payout failed', {
          payoutId: item.id,
          error: error.message
        });
      }
    }
  }
}
```

### Pattern 3: Multi-Agent Coordination

```javascript
// Payment Agent
class PaymentAgent extends OpenClawAgent {
  async onPaymentRequest(data) {
    const payment = await this.execute('nowpayments', 'create_payment', data);

    // Notify order agent
    await this.send('order-agent', 'payment_created', payment);

    // Start monitoring
    this.monitorPayment(payment.payment_id);
  }

  async onPaymentCompleted(paymentId) {
    // Notify fulfillment agent
    await this.send('fulfillment-agent', 'process_order', { paymentId });
  }
}

// Order Agent
class OrderAgent extends OpenClawAgent {
  async onMessage(from, type, data) {
    if (type === 'payment_created') {
      await this.db.orders.update(
        { id: data.order_id },
        { paymentId: data.payment_id, status: 'awaiting_payment' }
      );
    }
  }
}

// Fulfillment Agent
class FulfillmentAgent extends OpenClawAgent {
  async onMessage(from, type, data) {
    if (type === 'process_order') {
      const order = await this.db.orders.findOne({ paymentId: data.paymentId });
      await this.fulfillOrder(order);
    }
  }
}
```

## Testing

### Unit Tests

```javascript
describe('NOWPayments Integration', () => {
  let agent;

  beforeEach(() => {
    agent = new OpenClawAgent({
      skills: ['nowpayments']
    });
  });

  it('should create payment', async () => {
    const payment = await agent.execute('nowpayments', 'create_payment', {
      price: 100,
      currency: 'USD',
      pay_currency: 'BTC'
    });

    expect(payment.payment_id).toBeDefined();
    expect(payment.pay_address).toBeDefined();
  });

  it('should monitor payment status', async () => {
    const paymentId = 'test-payment-123';

    const result = await monitorPayment(agent, paymentId);

    expect(result.success).toBeDefined();
  });
});
```

### Integration Tests

```javascript
describe('Payment Flow', () => {
  it('should complete full payment lifecycle', async () => {
    // Create payment
    const payment = await createPayment(agent, 100, 'USD');
    expect(payment.paymentId).toBeDefined();

    // Verify payment created event
    const event = await agent.waitFor('payment_created');
    expect(event.payment_id).toBe(payment.paymentId);

    // Simulate payment completion (in sandbox)
    // ... payment completion logic ...

    // Verify completion event
    const completedEvent = await agent.waitFor('payment_completed');
    expect(completedEvent.payment_id).toBe(payment.paymentId);
  });
});
```

## Configuration

### Environment Variables

```bash
# Required
NOWPAYMENTS_API_KEY=your_api_key

# Optional
NOWPAYMENTS_IPN_SECRET=your_ipn_secret
NOWPAYMENTS_SANDBOX=false
NOWPAYMENTS_DEFAULT_CURRENCY=USD
NOWPAYMENTS_DEFAULT_PAY_CURRENCY=BTC
```

### OpenClaw Config

```yaml
# openclaw.config.yml
skills:
  - name: nowpayments
    enabled: true
    config:
      api_key: ${NOWPAYMENTS_API_KEY}
      sandbox: false
      webhook_url: https://your-domain.com/webhooks/nowpayments/ipn
      default_currency: USD
      supported_pay_currencies:
        - BTC
        - ETH
        - USDT
        - LTC
```

## Best Practices

1. **Always use JSON output mode** for programmatic access
2. **Implement proper error handling** for all payment operations
3. **Use webhooks (IPN)** instead of polling when possible
4. **Store payment IDs** in your database for tracking
5. **Validate amounts** before creating payments
6. **Monitor payment expiration** and notify users
7. **Implement retry logic** for failed API calls
8. **Use sandbox mode** for testing
9. **Secure webhook endpoints** with signature verification
10. **Log all payment operations** for audit trail

## Troubleshooting

### Common Issues

1. **API Key Not Found**: Ensure environment variable is set or use `nowpayments auth set`
2. **Rate Limiting**: Implement exponential backoff and respect rate limits
3. **Webhook Not Received**: Check firewall rules and verify IPN callback URL
4. **Payment Expired**: Monitor payments and send reminders before expiration
5. **Currency Not Supported**: Always validate currencies before creating payments

---

This integration guide enables seamless cryptocurrency payment processing in OpenClaw applications using the NOWPayments CLI as a foundation.
