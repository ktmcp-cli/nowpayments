# NOWPayments CLI - AI Agent Usage Guide

This guide provides patterns and examples for AI assistants (like Claude, ChatGPT, or custom agents) using the NOWPayments CLI.

## Why This CLI is Agent-Friendly

1. **Predictable JSON Output**: Use `--json` flag for consistent, parseable responses
2. **Clear Exit Codes**: Success (0) and failure (1) for easy status checking
3. **Composable Commands**: Unix philosophy - do one thing well
4. **Self-Documenting**: Built-in help text for all commands
5. **Error Messages**: Structured, informative error responses

## Agent Integration Patterns

### Pattern 1: Status Checking

Before executing operations, verify API connectivity:

```bash
nowpayments status
```

**Agent Decision Tree:**
- Success → Proceed with operations
- Failure → Inform user of connectivity issues

### Pattern 2: Currency Validation

Before creating payments, validate cryptocurrency support:

```bash
# Check if BTC is supported
nowpayments currencies info BTC

# Get all available currencies
nowpayments --json currencies list --available
```

**Agent Logic:**
```javascript
// Pseudo-code for agent
const result = await exec('nowpayments --json currencies list --available');
const data = JSON.parse(result.stdout);
const currencies = data.currencies || [];

if (!currencies.includes(requestedCurrency.toLowerCase())) {
  return "Currency not supported. Available: " + currencies.join(', ');
}
```

### Pattern 3: Price Estimation

Always estimate before creating payments:

```bash
nowpayments --json estimate convert \
  --from USD \
  --to BTC \
  --amount 100
```

**Agent Flow:**
1. Get user's desired amount and currencies
2. Call estimate to get conversion
3. Present estimate to user
4. Wait for confirmation before creating payment

### Pattern 4: Payment Creation

Create payments with all required parameters:

```bash
nowpayments --json payment create \
  --price 99.99 \
  --currency USD \
  --pay-currency BTC \
  --order-id "ORDER-${timestamp}" \
  --order-description "User's description"
```

**Agent Best Practices:**
- Generate unique `order-id` (timestamp, UUID, etc.)
- Include descriptive `order-description`
- Store `payment_id` for tracking
- Present `pay_address` and `pay_amount` clearly to user

### Pattern 5: Payment Monitoring

Poll payment status at reasonable intervals:

```bash
nowpayments --json payment get <payment_id>
```

**Agent Polling Logic:**
```javascript
async function monitorPayment(paymentId, maxMinutes = 30) {
  const startTime = Date.now();
  const maxTime = maxMinutes * 60 * 1000;

  while (Date.now() - startTime < maxTime) {
    const result = await exec(`nowpayments --json payment get ${paymentId}`);
    const payment = JSON.parse(result.stdout);

    switch (payment.payment_status) {
      case 'finished':
        return { status: 'completed', payment };
      case 'failed':
      case 'expired':
        return { status: 'failed', payment };
      case 'partially_paid':
        return { status: 'underpaid', payment };
      default:
        // Still processing, wait before next check
        await sleep(30000); // 30 seconds
    }
  }

  return { status: 'timeout' };
}
```

### Pattern 6: Error Handling

Parse errors and provide helpful responses:

```bash
nowpayments --json payment get invalid_id 2>&1
```

**Agent Error Response:**
```javascript
try {
  const result = await exec('nowpayments --json payment get invalid_id');
  const data = JSON.parse(result.stdout);
} catch (error) {
  // Parse error output
  const errorMsg = error.stderr || error.message;

  if (errorMsg.includes('API Error (401)')) {
    return "Authentication failed. Please check your API key.";
  } else if (errorMsg.includes('API Error (404)')) {
    return "Payment not found. Please verify the payment ID.";
  } else if (errorMsg.includes('Network error')) {
    return "Cannot reach NOWPayments API. Check internet connection.";
  }

  return "An error occurred: " + errorMsg;
}
```

## Common Agent Workflows

### Workflow 1: Create Payment

```bash
# Step 1: Validate currency
nowpayments currencies info BTC

# Step 2: Get estimate
nowpayments --json estimate convert \
  --from USD \
  --to BTC \
  --amount 100

# Step 3: Create payment
nowpayments --json payment create \
  --price 100 \
  --currency USD \
  --pay-currency BTC \
  --order-id "ORDER-123"

# Step 4: Monitor status
nowpayments --json payment get <payment_id>
```

**Agent Narrative:**
```
I'll help you create a Bitcoin payment for $100.

1. Validating BTC support... ✓
2. Getting current exchange rate...
   - Rate: 0.00234 BTC = $100 USD
3. Creating payment...
   - Payment ID: abc123
   - Send exactly 0.00234 BTC to: bc1qxy2kg...
   - Expires in: 1 hour
4. I'll monitor this payment for you.
```

### Workflow 2: List and Filter Payments

```bash
# Get recent payments
nowpayments --json payment list --limit 10 --order desc

# Filter by date range
nowpayments --json payment list \
  --date-from 2024-01-01 \
  --date-to 2024-01-31

# Find specific payment
nowpayments --json payment get abc123
```

**Agent Context Awareness:**
```javascript
// Agent keeps track of recent payments
const recentPayments = await getRecentPayments();

// When user says "check my last payment"
const lastPayment = recentPayments[0];
const status = await exec(`nowpayments --json payment get ${lastPayment.id}`);

// Present status in natural language
```

### Workflow 3: Invoice Management

```bash
# Create invoice
nowpayments --json invoice create \
  --price 49.99 \
  --currency USD \
  --order-id "INV-456" \
  --success-url "https://example.com/success"

# Share invoice URL with user
# Returns: { "invoice_url": "https://nowpayments.io/payment/?iid=..." }
```

**Agent Response:**
```
I've created an invoice for $49.99:

Invoice ID: 1234567
Payment URL: https://nowpayments.io/payment/?iid=abc123

Share this link with your customer. They can pay with any supported cryptocurrency.
When payment is complete, they'll be redirected to your success page.
```

## Advanced Agent Techniques

### Technique 1: Batch Operations

Process multiple payments efficiently:

```bash
# List all waiting payments
payments=$(nowpayments --json payment list --limit 100)

# Check each one
echo "$payments" | jq -r '.data[] | select(.payment_status == "waiting") | .payment_id' | \
while read payment_id; do
  nowpayments --json payment get "$payment_id"
done
```

### Technique 2: Smart Retries

Implement exponential backoff for API calls:

```javascript
async function withRetry(command, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await exec(command);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await sleep(delay);
    }
  }
}
```

### Technique 3: Caching Currency Lists

Cache currency list to reduce API calls:

```javascript
let currencyCache = null;
let cacheTime = null;
const CACHE_TTL = 3600000; // 1 hour

async function getAvailableCurrencies() {
  const now = Date.now();

  if (currencyCache && (now - cacheTime) < CACHE_TTL) {
    return currencyCache;
  }

  const result = await exec('nowpayments --json currencies list --available');
  currencyCache = JSON.parse(result.stdout);
  cacheTime = now;

  return currencyCache;
}
```

### Technique 4: Context Preservation

Maintain payment context across conversation:

```javascript
// Agent maintains session state
const session = {
  currentPayment: null,
  recentPayments: [],
  preferences: {
    defaultCurrency: 'USD',
    defaultPayCurrency: 'BTC'
  }
};

// When user says "check the status"
if (session.currentPayment) {
  const status = await checkPayment(session.currentPayment.id);
  return formatStatus(status);
}
```

## Output Formatting for Users

### Format Payment Details

```javascript
function formatPayment(payment) {
  return `
Payment Details:
- Status: ${payment.payment_status}
- Amount: ${payment.pay_amount} ${payment.pay_currency}
- Price: ${payment.price_amount} ${payment.price_currency}
- Address: ${payment.pay_address}
- Created: ${new Date(payment.created_at).toLocaleString()}
${payment.order_id ? `- Order: ${payment.order_id}` : ''}
  `.trim();
}
```

### Format Currency List

```javascript
function formatCurrencies(currencies) {
  const popular = ['BTC', 'ETH', 'USDT', 'USDC', 'LTC'];
  const others = currencies.filter(c => !popular.includes(c.toUpperCase()));

  return `
Popular Cryptocurrencies:
${popular.map(c => `  • ${c}`).join('\n')}

Other Available (${others.length}):
${others.slice(0, 10).map(c => `  • ${c.toUpperCase()}`).join('\n')}
${others.length > 10 ? `  ... and ${others.length - 10} more` : ''}
  `.trim();
}
```

## Security Considerations

### 1. API Key Management

Never expose API keys in logs or responses:

```javascript
// ✗ Bad
console.log(`Using API key: ${apiKey}`);

// ✓ Good
console.log(`API key configured: ${apiKey.substring(0, 4)}...`);
```

### 2. Input Validation

Validate user inputs before passing to CLI:

```javascript
function validateAmount(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return num;
}

function validateCurrency(currency) {
  if (!/^[A-Z]{3,5}$/.test(currency.toUpperCase())) {
    throw new Error('Invalid currency format');
  }
  return currency.toUpperCase();
}
```

### 3. Address Validation

Validate cryptocurrency addresses before payouts:

```javascript
// Basic validation (use proper library in production)
function validateBtcAddress(address) {
  if (address.startsWith('bc1') && address.length >= 42) {
    return true; // Bech32
  }
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    return true; // Legacy
  }
  throw new Error('Invalid Bitcoin address');
}
```

## Testing Agent Integration

### Unit Test Example

```javascript
describe('Payment Creation', () => {
  it('should create payment with valid parameters', async () => {
    const result = await exec(`nowpayments --json payment create \
      --price 100 \
      --currency USD \
      --pay-currency BTC`);

    const payment = JSON.parse(result.stdout);
    expect(payment.payment_id).toBeDefined();
    expect(payment.pay_address).toBeDefined();
    expect(payment.payment_status).toBe('waiting');
  });

  it('should fail with invalid amount', async () => {
    await expect(
      exec(`nowpayments payment create --price -10 --currency USD --pay-currency BTC`)
    ).rejects.toThrow();
  });
});
```

### Integration Test Example

```javascript
describe('Full Payment Flow', () => {
  it('should handle complete payment lifecycle', async () => {
    // Create payment
    const createResult = await exec(`nowpayments --json payment create \
      --price 100 --currency USD --pay-currency BTC`);
    const payment = JSON.parse(createResult.stdout);

    // Verify payment exists
    const getResult = await exec(`nowpayments --json payment get ${payment.payment_id}`);
    const retrieved = JSON.parse(getResult.stdout);

    expect(retrieved.payment_id).toBe(payment.payment_id);
    expect(retrieved.payment_status).toBe('waiting');
  });
});
```

## Performance Tips

1. **Use JSON mode**: Faster parsing than formatted output
2. **Batch requests**: Combine operations where possible
3. **Cache static data**: Currency lists don't change often
4. **Reasonable polling**: Don't check payment status more than once per 30 seconds
5. **Parallel requests**: Independent operations can run concurrently

## Troubleshooting

### Issue: "No API key found"

```javascript
// Check multiple sources
const apiKey = process.env.NOWPAYMENTS_API_KEY ||
               await getFromConfig() ||
               await promptUser();

if (!apiKey) {
  return "Please set your API key: nowpayments auth set YOUR_KEY";
}
```

### Issue: Rate limiting

```javascript
if (error.includes('429') || error.includes('rate limit')) {
  return "API rate limit reached. Please wait a moment and try again.";
}
```

### Issue: Network errors

```javascript
if (error.includes('ENOTFOUND') || error.includes('Network error')) {
  return "Cannot connect to NOWPayments. Check your internet connection.";
}
```

## Best Practices Summary

1. Always use `--json` for programmatic access
2. Validate inputs before calling CLI
3. Handle all error cases gracefully
4. Provide clear, natural language responses
5. Cache where appropriate
6. Monitor but don't spam (reasonable polling intervals)
7. Keep context between commands
8. Test error paths thoroughly
9. Never expose sensitive data in logs
10. Use proper exit code checking

---

This CLI is designed to be a reliable tool for AI agents to integrate cryptocurrency payments into their workflows. The combination of structured JSON output, clear error handling, and comprehensive commands makes it ideal for autonomous operation.
