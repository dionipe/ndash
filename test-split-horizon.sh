#!/bin/bash

# NDash Split-Horizon DNS Test Script
# Tests the Split-Horizon DNS proxy functionality

echo "🌐 NDash Split-Horizon DNS Test"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROXY_HOST="127.0.0.1"
PROXY_PORT="5353"
UPSTREAM_HOST="127.0.0.1"
UPSTREAM_PORT="53"
TEST_DOMAIN="dionipe.id"

echo -e "${BLUE}Configuration:${NC}"
echo "  Proxy Server: $PROXY_HOST:$PROXY_PORT (Split-Horizon)"
echo "  Upstream DNS: $UPSTREAM_HOST:$UPSTREAM_PORT (PowerDNS)"
echo "  Test Domain: $TEST_DOMAIN"
echo ""

# Function to extract IP from dig output
extract_ip() {
    grep -A1 "ANSWER SECTION" | tail -1 | awk '{print $5}'
}

echo -e "${YELLOW}Testing Split-Horizon DNS functionality...${NC}"
echo ""

# Test 1: External client (via proxy)
echo -e "${BLUE}Test 1: External client (127.0.0.1 via proxy)${NC}"
EXTERNAL_IP=$(dig @$PROXY_HOST -p $PROXY_PORT $TEST_DOMAIN +short 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$EXTERNAL_IP" ]; then
    echo -e "  ${GREEN}✓ External response: $EXTERNAL_IP${NC}"
else
    echo -e "  ${RED}✗ Failed to get external response${NC}"
fi

# Test 2: Internal client (direct to PowerDNS)
echo -e "${BLUE}Test 2: Internal client (direct to PowerDNS)${NC}"
INTERNAL_IP=$(dig @$UPSTREAM_HOST $TEST_DOMAIN +short 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$INTERNAL_IP" ]; then
    echo -e "  ${GREEN}✓ Internal response: $INTERNAL_IP${NC}"
else
    echo -e "  ${RED}✗ Failed to get internal response${NC}"
fi

echo ""

# Compare results
if [ "$EXTERNAL_IP" != "$INTERNAL_IP" ] && [ ! -z "$EXTERNAL_IP" ] && [ ! -z "$INTERNAL_IP" ]; then
    echo -e "${GREEN}🎉 SUCCESS: Split-Horizon is working!${NC}"
    echo "  External clients get: $EXTERNAL_IP"
    echo "  Internal clients get: $INTERNAL_IP"
    echo ""
    echo -e "${BLUE}Configured subnets:${NC}"
    echo "  Internal: 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12"
    echo "  External: 0.0.0.0/0 (everything else)"
elif [ "$EXTERNAL_IP" = "$INTERNAL_IP" ] && [ ! -z "$EXTERNAL_IP" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Both responses are identical${NC}"
    echo "  This might indicate Split-Horizon is not properly configured"
    echo "  Both responses: $EXTERNAL_IP"
else
    echo -e "${RED}❌ FAILED: Could not retrieve DNS responses${NC}"
    echo "  Check if NDash and PowerDNS are running"
fi

echo ""
echo -e "${BLUE}To test from different client IPs, you can:${NC}"
echo "1. Use different machines in internal/external networks"
echo "2. Configure your DNS resolver to use the proxy (port 5353)"
echo "3. Test with tools like 'dig' from different network segments"

echo ""
echo -e "${BLUE}Current Split-Horizon configuration:${NC}"
curl -s http://localhost:3000/api/split-horizon/config | jq '.zones[0]' 2>/dev/null || echo "Could not fetch config (NDash not running?)"