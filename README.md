# NOWPayments CLI

A production-ready command-line interface for the [NOWPayments](https://nowpayments.io) cryptocurrency payment processing API. Built with Commander.js for robust API integration and automation.

## Why CLI > MCP

While Model Context Protocol (MCP) servers provide AI integration, a dedicated CLI offers superior advantages:

### 1. Universal Tool Integration
- Works with **any** AI assistant (Claude, ChatGPT, local models)
- No MCP server dependency or compatibility issues
- Standard stdin/stdout interface that all tools understand

### 2. Human-First Design
- Direct terminal usage for developers and operators
- Rich formatted output with colors and tables
- Interactive workflows when needed
- Scriptable for automation

### 3. Reliability & Performance
- No additional server process to manage
- Direct API calls with minimal overhead
- Proper error handling and exit codes
- No WebSocket/transport layer complexity

### 4. Development Velocity
- Easier to test (just run commands)
- Simpler debugging (standard logs)
- Faster iteration (no server restarts)
- Better CI/CD integration

### 5. Production Ready
- Works in Docker containers
- Cron job compatible
- Shell script integration
- No daemon management

**Bottom Line:** CLIs are battle-tested, universal interfaces. MCP adds complexity for integration scenarios where a simple CLI + agent pattern works better.

## Features

- Full NOWPayments API coverage
- Rich terminal output with colors and formatting
- JSON output mode for scripting
- Persistent API key management
- Sandbox environment support
- Comprehensive error handling
- Production-ready reliability

## Installation

```bash
npm install -g @ktmcp-cli/nowpayments
```

Or install locally:

```bash
cd ktmcp-nowpayments-cli
npm install
npm link
```

## Quick Start

### 1. Get Your API Key

Sign up at [NOWPayments.io](https://nowpayments.io) and generate an API key.

### 2. Configure Authentication

```bash
# Save API key to config (recommended)
nowpayments auth set YOUR_API_KEY

# Or use environment variable
export NOWPAYMENTS_API_KEY=your_api_key

# Or pass with each command
nowpayments --api-key YOUR_API_KEY status
```

### 3. Verify Connection

```bash
nowpayments status
```

## Usage

### Authentication Management

```bash
# Set API key
nowpayments auth set YOUR_API_KEY

# Show current key (masked)
nowpayments auth show

# Clear API key
nowpayments auth clear
```

### Check API Status

```bash
nowpayments status
```

### Currency Operations

```bash
# List all available cryptocurrencies
nowpayments currencies list

# Show only available payment currencies
nowpayments currencies list --available

# Get currency information
nowpayments currencies info BTC
```

### Price Estimates

```bash
# Estimate cryptocurrency amount for fiat price
nowpayments estimate convert --from USD --to BTC --amount 100

# Get minimum payment amount
nowpayments estimate min --from USD --to BTC
```

### Payment Management

```bash
# Create a new payment
nowpayments payment create \
  --price 99.99 \
  --currency USD \
  --pay-currency BTC \
  --order-id "ORDER-123" \
  --order-description "Premium subscription"

# Get payment details
nowpayments payment get <payment_id>

# List all payments
nowpayments payment list --limit 20

# Filter payments by date
nowpayments payment list \
  --date-from 2024-01-01 \
  --date-to 2024-12-31

# Update payment estimate (before expiration)
nowpayments payment update-estimate <payment_id>
```

### Invoice Management

```bash
# Create an invoice
nowpayments invoice create \
  --price 49.99 \
  --currency USD \
  --order-id "INV-456" \
  --success-url "https://example.com/success" \
  --cancel-url "https://example.com/cancel"

# Get invoice details
nowpayments invoice get <invoice_id>

# List invoices
nowpayments invoice list --limit 10
```

### Payout Operations

```bash
# Create a payout
nowpayments payout create \
  --amount 0.01 \
  --currency BTC \
  --address "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"

# Verify payout with 2FA
nowpayments payout verify <payout_id> <verification_code>

# Get payout details
nowpayments payout get <payout_id>

# List payouts
nowpayments payout list
```

### Global Options

```bash
# Use sandbox environment
nowpayments --sandbox status

# Output raw JSON (for scripting)
nowpayments --json payment list

# Enable debug logging
nowpayments --debug payment create --price 100 --currency USD --pay-currency BTC

# Combine options
nowpayments --sandbox --json currencies list
```

## Advanced Usage

### Scripting with JSON Output

```bash
# Get payment status in JSON
payment_data=$(nowpayments --json payment get abc123)
status=$(echo "$payment_data" | jq -r '.payment_status')

if [ "$status" = "finished" ]; then
  echo "Payment completed!"
fi
```

### Environment Variables

```bash
# Set in .env file
NOWPAYMENTS_API_KEY=your_api_key

# Load automatically
nowpayments status
```

### Automation Example

```bash
#!/bin/bash
# Create payment and monitor status

# Create payment
payment=$(nowpayments --json payment create \
  --price 100 \
  --currency USD \
  --pay-currency BTC)

payment_id=$(echo "$payment" | jq -r '.payment_id')
pay_address=$(echo "$payment" | jq -r '.pay_address')

echo "Payment created: $payment_id"
echo "Send to: $pay_address"

# Monitor status
while true; do
  status=$(nowpayments --json payment get "$payment_id" | jq -r '.payment_status')
  echo "Status: $status"

  if [ "$status" = "finished" ]; then
    echo "Payment completed!"
    break
  fi

  sleep 30
done
```

## Payment Flow

1. **Create Estimate**: Check conversion rates and fees
   ```bash
   nowpayments estimate convert --from USD --to BTC --amount 100
   ```

2. **Create Payment**: Generate payment address
   ```bash
   nowpayments payment create --price 100 --currency USD --pay-currency BTC
   ```

3. **Customer Sends Crypto**: Customer sends exact amount to provided address

4. **Monitor Status**: Poll payment status or use IPN callbacks
   ```bash
   nowpayments payment get <payment_id>
   ```

5. **Payment Confirmed**: Status changes to "finished"

## Payment Statuses

- `waiting` - Waiting for customer payment
- `confirming` - Payment received, confirming on blockchain
- `confirmed` - Payment confirmed
- `sending` - Sending to your wallet
- `partially_paid` - Underpaid
- `finished` - Complete
- `failed` - Transaction failed
- `refunded` - Payment refunded
- `expired` - Payment window expired

## Error Handling

The CLI provides detailed error messages and proper exit codes:

- Exit code 0: Success
- Exit code 1: Error (API error, validation error, etc.)

```bash
# Check exit code
nowpayments payment get invalid_id
echo $?  # Returns 1 on error
```

## Configuration

Configuration is stored in `~/.nowpayments/config.json`:

```json
{
  "apiKey": "your_api_key",
  "sandbox": false,
  "defaultCurrency": "USD",
  "defaultPayCurrency": "BTC"
}
```

## API Documentation

For detailed API documentation, see:
- [NOWPayments API Docs](https://documenter.getpostman.com/view/7907941/S1a32n38)
- [OpenAPI Specification](./openapi.json)

## AI Agent Usage

See [AGENT.md](./AGENT.md) for patterns and examples for AI assistants using this CLI.

## OpenClaw Integration

See [OPENCLAW.md](./OPENCLAW.md) for integration with the OpenClaw agent framework.

## Examples

See [examples/](./examples/) directory for complete usage examples:
- Basic payment flow
- Invoice generation
- Payout automation
- Status monitoring

## Requirements

- Node.js >= 16.0.0
- NOWPayments API key

## License

MIT

## Support

- GitHub Issues: Report bugs and request features
- NOWPayments Support: https://nowpayments.io/help
- API Status: https://status.nowpayments.io

## Contributing

Contributions welcome! Please submit pull requests or open issues.

---

Built with Commander.js for the KTMCP project.
