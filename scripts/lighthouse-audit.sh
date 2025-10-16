#!/bin/bash

# Lighthouse Security Audit Script
# Generates Lighthouse reports in appropriate locations based on environment
# 
# Usage: ./scripts/lighthouse-audit.sh [url]
# 
# SECURITY: Reports are written to:
# - Local dev: ./.reports/lighthouse-security-report.json
# - Netlify CI: /tmp/lh/lighthouse-security-report.json
# 
# This prevents sensitive data from being published to the site.

set -e

# Default URL if not provided
URL="${1:-http://localhost:8080}"

# Determine output directory based on environment
if [ "$NETLIFY" = "true" ]; then
    # Netlify CI environment - write to temp directory
    OUTPUT_DIR="/tmp/lh"
    echo "🔧 Netlify CI detected - writing report to temp directory"
else
    # Local development - write to reports directory
    OUTPUT_DIR="./.reports"
    echo "💻 Local development - writing report to .reports directory"
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Output file path
OUTPUT_FILE="$OUTPUT_DIR/lighthouse-security-report.json"

echo "🚀 Running Lighthouse security audit on: $URL"
echo "📁 Output file: $OUTPUT_FILE"

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo "❌ Lighthouse CLI not found. Install with: npm install -g lighthouse"
    exit 1
fi

# Run Lighthouse audit
lighthouse "$URL" \
    --only-categories=security \
    --output=json \
    --output-path="$OUTPUT_FILE" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --quiet

if [ $? -eq 0 ]; then
    echo "✅ Lighthouse security audit completed successfully"
    echo "📊 Report saved to: $OUTPUT_FILE"
    
    # Show summary for local development
    if [ "$NETLIFY" != "true" ]; then
        echo ""
        echo "📈 Security Score Summary:"
        node -e "
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('$OUTPUT_FILE', 'utf8'));
            const securityScore = report.categories?.security?.score;
            if (securityScore !== null) {
                console.log(\`   Security Score: \${Math.round(securityScore * 100)}/100\`);
            } else {
                console.log('   Security Score: Not available');
            }
        " 2>/dev/null || echo "   Could not parse score from report"
    fi
else
    echo "❌ Lighthouse audit failed"
    exit 1
fi
