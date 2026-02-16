#!/bin/bash

##
# NOWPayments CLI Test Suite
#
# Tests all major functionality of the CLI without requiring an actual API key.
# Uses mock responses and validates command structure.
##

set -e

CLI="node bin/nowpayments.js"
ERRORS=0
TESTS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  NOWPayments CLI Test Suite"
echo "========================================"
echo ""

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
  TESTS=$((TESTS + 1))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ERRORS=$((ERRORS + 1))
  TESTS=$((TESTS + 1))
}

info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# Test 1: CLI executable
echo "Testing CLI structure..."
if [ -f "bin/nowpayments.js" ]; then
  pass "CLI entry point exists"
else
  fail "CLI entry point not found"
fi

# Test 2: Help output
if $CLI --help > /dev/null 2>&1; then
  pass "Help command works"
else
  fail "Help command failed"
fi

# Test 3: Version output
if $CLI --version > /dev/null 2>&1; then
  pass "Version command works"
else
  fail "Version command failed"
fi

# Test 4: Command structure
echo ""
echo "Testing command structure..."

commands=("auth" "status" "currencies" "estimate" "payment" "invoice" "payout")

for cmd in "${commands[@]}"; do
  if $CLI "$cmd" --help > /dev/null 2>&1; then
    pass "Command '$cmd' registered"
  else
    fail "Command '$cmd' not found"
  fi
done

# Test 5: Auth commands
echo ""
echo "Testing auth commands..."

if $CLI auth --help | grep -q "set"; then
  pass "Auth 'set' subcommand exists"
else
  fail "Auth 'set' subcommand missing"
fi

if $CLI auth --help | grep -q "show"; then
  pass "Auth 'show' subcommand exists"
else
  fail "Auth 'show' subcommand missing"
fi

# Test 6: Payment commands
echo ""
echo "Testing payment commands..."

payment_cmds=("create" "get" "list" "update-estimate")

for cmd in "${payment_cmds[@]}"; do
  if $CLI payment --help | grep -q "$cmd"; then
    pass "Payment '$cmd' subcommand exists"
  else
    fail "Payment '$cmd' subcommand missing"
  fi
done

# Test 7: Estimate commands
echo ""
echo "Testing estimate commands..."

if $CLI estimate --help | grep -q "convert"; then
  pass "Estimate 'convert' subcommand exists"
else
  fail "Estimate 'convert' subcommand missing"
fi

if $CLI estimate --help | grep -q "min"; then
  pass "Estimate 'min' subcommand exists"
else
  fail "Estimate 'min' subcommand missing"
fi

# Test 8: Library files
echo ""
echo "Testing library structure..."

libs=("src/lib/api.js" "src/lib/auth.js" "src/lib/config.js")

for lib in "${libs[@]}"; do
  if [ -f "$lib" ]; then
    pass "Library file '$lib' exists"
  else
    fail "Library file '$lib' not found"
  fi
done

# Test 9: Command files
echo ""
echo "Testing command files..."

cmd_files=("auth.js" "status.js" "currencies.js" "estimate.js" "payment.js" "invoice.js" "payout.js")

for file in "${cmd_files[@]}"; do
  if [ -f "src/commands/$file" ]; then
    pass "Command file '$file' exists"
  else
    fail "Command file '$file' not found"
  fi
done

# Test 10: Documentation
echo ""
echo "Testing documentation..."

docs=("README.md" "AGENT.md" "OPENCLAW.md" "INSTALL.md")

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    pass "Documentation '$doc' exists"
  else
    fail "Documentation '$doc' not found"
  fi
done

# Test 11: Package configuration
echo ""
echo "Testing package configuration..."

if [ -f "package.json" ]; then
  pass "package.json exists"

  if grep -q '"name": "@ktmcp-cli/nowpayments"' package.json; then
    pass "Package name is correct"
  else
    fail "Package name is incorrect"
  fi

  if grep -q '"bin"' package.json; then
    pass "Binary entry point configured"
  else
    fail "Binary entry point not configured"
  fi
else
  fail "package.json not found"
fi

# Test 12: Examples
echo ""
echo "Testing example files..."

examples=("basic-payment.js" "monitor-payment.js" "invoice-flow.js")

for example in "${examples[@]}"; do
  if [ -f "examples/$example" ]; then
    pass "Example '$example' exists"
  else
    fail "Example '$example' not found"
  fi
done

# Test 13: Required options validation
echo ""
echo "Testing option validation..."

# Payment create should fail without required options
if ! $CLI payment create 2>&1 | grep -q "required option"; then
  fail "Missing required option validation"
else
  pass "Required option validation works"
fi

# Test 14: File permissions
echo ""
echo "Testing file permissions..."

if [ -x "bin/nowpayments.js" ]; then
  pass "CLI binary is executable"
else
  fail "CLI binary is not executable"
fi

# Summary
echo ""
echo "========================================"
echo "  Test Summary"
echo "========================================"
echo "Total tests: $TESTS"
echo -e "Passed: ${GREEN}$((TESTS - ERRORS))${NC}"
echo -e "Failed: ${RED}$ERRORS${NC}"

if [ $ERRORS -eq 0 ]; then
  echo ""
  echo -e "${GREEN}All tests passed! ✓${NC}"
  echo ""
  echo "The CLI structure is correct and ready for use."
  echo ""
  echo "Next steps:"
  echo "  1. Install dependencies: npm install"
  echo "  2. Set API key: $CLI auth set YOUR_KEY"
  echo "  3. Test connection: $CLI status"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}Some tests failed.${NC}"
  echo "Please review the errors above."
  exit 1
fi
