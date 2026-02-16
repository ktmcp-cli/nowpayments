# Installation and Quick Start Guide

Complete installation and setup instructions for the NOWPayments CLI.

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- NOWPayments account and API key

## Installation Options

### Option 1: Install Globally (Recommended)

```bash
npm install -g @ktmcp-cli/nowpayments
```

After installation, the `nowpayments` command will be available globally.

### Option 2: Install Locally

```bash
# Clone or download the CLI
cd ktmcp-nowpayments-cli

# Install dependencies
npm install

# Link for global use
npm link

# Or use directly
node bin/nowpayments.js --help
```

### Option 3: Use with npx

```bash
npx @ktmcp-cli/nowpayments status
```

## Getting Your API Key

1. Sign up at [NOWPayments.io](https://nowpayments.io)
2. Complete email verification
3. Set up your outcome wallet (where you'll receive payments)
4. Navigate to Settings > API
5. Generate a new API key
6. Copy and save the API key securely

## Configuration

### Method 1: Save to Config File (Recommended)

```bash
nowpayments auth set YOUR_API_KEY
```

This saves the API key to `~/.nowpayments/config.json`.

### Method 2: Environment Variable

Create a `.env` file in your project:

```bash
cp .env.example .env
```

Edit `.env`:

```env
NOWPAYMENTS_API_KEY=your_actual_api_key
NOWPAYMENTS_SANDBOX=false
```

### Method 3: Command Line Flag

```bash
nowpayments --api-key YOUR_API_KEY status
```

### Method 4: Export to Shell

```bash
export NOWPAYMENTS_API_KEY=your_api_key
nowpayments status
```

## Verify Installation

```bash
# Check version
nowpayments --version

# Test API connection
nowpayments status

# View help
nowpayments --help
```

Expected output:
```
✓ NOWPayments API is OK
```

## First Steps

### 1. List Available Currencies

```bash
nowpayments currencies list --available
```

### 2. Get a Price Estimate

```bash
nowpayments estimate convert --from USD --to BTC --amount 100
```

### 3. Create Your First Payment

```bash
nowpayments payment create \
  --price 10 \
  --currency USD \
  --pay-currency BTC \
  --order-id "TEST-001" \
  --order-description "Test payment"
```

### 4. Check Payment Status

```bash
# Replace with your actual payment ID
nowpayments payment get <payment_id>
```

## Testing with Sandbox

NOWPayments provides a sandbox environment for testing:

```bash
# Use sandbox for all commands
nowpayments --sandbox status
nowpayments --sandbox payment create --price 10 --currency USD --pay-currency BTC

# Or set in .env
NOWPAYMENTS_SANDBOX=true
```

**Note:** You'll need a separate sandbox API key from the NOWPayments dashboard.

## Running Examples

The CLI includes example scripts demonstrating common workflows:

### Basic Payment Example

```bash
cd examples
node basic-payment.js
```

This creates a simple payment and displays the details.

### Monitor Payment Example

```bash
# First create a payment, then monitor it
payment_id=$(nowpayments --json payment create --price 10 --currency USD --pay-currency BTC | jq -r '.payment_id')

# Monitor until completion
node examples/monitor-payment.js "$payment_id"
```

### Invoice Flow Example

```bash
node examples/invoice-flow.js
```

This creates an invoice and demonstrates the invoice workflow.

## Troubleshooting

### "No API key found"

**Problem:** CLI cannot find your API key.

**Solutions:**
1. Run `nowpayments auth set YOUR_KEY`
2. Check `.env` file exists and has correct key
3. Verify environment variable: `echo $NOWPAYMENTS_API_KEY`

### "API Error (401): Unauthorized"

**Problem:** Invalid or expired API key.

**Solutions:**
1. Verify API key is correct
2. Generate a new API key in NOWPayments dashboard
3. Check you're using production key for production API (not sandbox)

### "Network error: Unable to reach NOWPayments API"

**Problem:** Network connectivity issues.

**Solutions:**
1. Check internet connection
2. Verify firewall settings
3. Try with `--debug` flag for more details
4. Check NOWPayments API status: https://status.nowpayments.io

### "Command not found: nowpayments"

**Problem:** CLI not in PATH.

**Solutions:**
1. Run `npm link` in CLI directory
2. Install globally: `npm install -g .`
3. Use full path: `node /path/to/bin/nowpayments.js`

### Permission Denied

**Problem:** Binary not executable.

**Solution:**
```bash
chmod +x bin/nowpayments.js
```

## Advanced Configuration

### Custom Config Location

You can use a custom config file:

```bash
# The CLI looks for config at:
~/.nowpayments/config.json

# Example config structure:
{
  "apiKey": "your_key",
  "sandbox": false,
  "defaultCurrency": "USD",
  "defaultPayCurrency": "BTC"
}
```

### Debug Mode

Enable debug logging to see detailed API requests and responses:

```bash
nowpayments --debug payment create --price 10 --currency USD --pay-currency BTC
```

Output includes:
- API endpoints being called
- Request payloads
- Response data
- HTTP status codes

### JSON Output Mode

For scripting and automation, use JSON output:

```bash
# All commands support --json flag
nowpayments --json status
nowpayments --json payment list
nowpayments --json currencies list --available

# Parse with jq
nowpayments --json payment get <id> | jq '.payment_status'
```

## Integration Patterns

### Shell Scripts

```bash
#!/bin/bash
# create-payment.sh

PRICE=$1
CURRENCY=$2

if [ -z "$PRICE" ] || [ -z "$CURRENCY" ]; then
  echo "Usage: ./create-payment.sh <price> <currency>"
  exit 1
fi

result=$(nowpayments --json payment create \
  --price "$PRICE" \
  --currency USD \
  --pay-currency "$CURRENCY")

payment_id=$(echo "$result" | jq -r '.payment_id')
pay_address=$(echo "$result" | jq -r '.pay_address')

echo "Payment created!"
echo "ID: $payment_id"
echo "Address: $pay_address"
```

### Node.js

```javascript
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function createPayment(amount, currency) {
  const result = await execPromise(
    `nowpayments --json payment create --price ${amount} --currency USD --pay-currency ${currency}`
  );

  return JSON.parse(result.stdout);
}

createPayment(100, 'BTC').then(payment => {
  console.log('Payment created:', payment.payment_id);
});
```

### Python

```python
import subprocess
import json

def create_payment(amount, currency):
    result = subprocess.run([
        'nowpayments', '--json', 'payment', 'create',
        '--price', str(amount),
        '--currency', 'USD',
        '--pay-currency', currency
    ], capture_output=True, text=True)

    return json.loads(result.stdout)

payment = create_payment(100, 'BTC')
print(f"Payment created: {payment['payment_id']}")
```

## Next Steps

1. Read the [README.md](./README.md) for full command reference
2. Review [AGENT.md](./AGENT.md) for AI agent integration patterns
3. Check [OPENCLAW.md](./OPENCLAW.md) for OpenClaw framework integration
4. Explore example scripts in `examples/` directory
5. Review NOWPayments API documentation: https://documenter.getpostman.com/view/7907941/S1a32n38

## Getting Help

- CLI Help: `nowpayments --help`
- Command Help: `nowpayments <command> --help`
- NOWPayments Docs: https://nowpayments.io/help
- API Status: https://status.nowpayments.io
- Support: support@nowpayments.io

## Upgrading

```bash
# Global installation
npm update -g @ktmcp-cli/nowpayments

# Local installation
cd ktmcp-nowpayments-cli
git pull
npm install
```

## Uninstalling

```bash
# Global installation
npm uninstall -g @ktmcp-cli/nowpayments

# Local installation
npm unlink
rm -rf ~/.nowpayments  # Remove config (optional)
```

---

You're now ready to accept cryptocurrency payments from the command line!
