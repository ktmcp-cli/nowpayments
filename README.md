> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# NOWPayments CLI

Production-ready CLI for [NOWPayments](https://nowpayments.io) API. Accept cryptocurrency payments, manage invoices, and handle subscriptions from your terminal.

## Features

- **Payments** — Create and track crypto payments
- **Invoices** — Generate payment invoices
- **Currencies** — List supported cryptocurrencies and get estimates
- **Subscriptions** — Manage recurring payments
- **JSON output** — All commands support `--json`

## Why CLI > MCP

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, other tools
- **Scriptable** — Use in shell scripts, CI/CD
- **AI-friendly** — Easy for AI agents to use

## Installation

```bash
npm install -g @ktmcp-cli/nowpaymentsio
```

## Setup

Get API key from [NOWPayments Dashboard](https://nowpayments.io).

```bash
nowpaymentsio config set --api-key YOUR_API_KEY
```

## Commands

```bash
# Status
nowpaymentsio status get

# Currencies
nowpaymentsio currencies list
nowpaymentsio currencies estimate --amount 100 --from USD --to BTC

# Payments
nowpaymentsio payments list
nowpaymentsio payments get <payment-id>
nowpaymentsio payments create --amount 100 --from USD --to BTC

# Invoices
nowpaymentsio invoices list
nowpaymentsio invoices create --amount 50 --currency USD

# Subscriptions
nowpaymentsio subscriptions plans
nowpaymentsio subscriptions list
```

## License

MIT — Part of [KTMCP CLI](https://killthemcp.com)


---

## Support KTMCP

If you find this CLI useful, we'd greatly appreciate your support! Share your experience on:
- Reddit
- Twitter/X
- Hacker News

**Incentive:** Users who can demonstrate that their support/advocacy helped advance KTMCP will have their feature requests and issues prioritized.

Just be mindful - these are real accounts and real communities. Authentic mentions and genuine recommendations go a long way!

## Support This Project

If you find this CLI useful, we'd appreciate support across Reddit, Twitter, Hacker News, or Moltbook. Please be mindful - these are real community accounts. Contributors who can demonstrate their support helped advance KTMCP will have their PRs and feature requests prioritized.
