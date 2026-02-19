# AGENT.md — NOWPayments CLI for AI Agents

## Overview

The `nowpaymentsio` CLI provides cryptocurrency payment processing.

## Setup

```bash
nowpaymentsio config set --api-key <key>
```

## Commands

### Currencies
```bash
nowpaymentsio currencies list --json
nowpaymentsio currencies estimate --amount 100 --from USD --to BTC --json
```

### Payments
```bash
nowpaymentsio payments list --json
nowpaymentsio payments get <id> --json
nowpaymentsio payments create --amount 100 --from USD --to BTC --json
```

### Invoices
```bash
nowpaymentsio invoices list --json
nowpaymentsio invoices create --amount 50 --currency USD --json
```

### Subscriptions
```bash
nowpaymentsio subscriptions plans --json
nowpaymentsio subscriptions list --json
```

Always use `--json` for programmatic parsing.
