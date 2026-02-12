#!/usr/bin/env bash
# ArcJournal — First-time setup script
set -e

echo "🔷 ArcJournal Setup"
echo "===================="

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js v18+."
  exit 1
fi

echo "✅ Node $(node -v) found"

# Install root deps
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install server deps
echo ""
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Install client deps
echo ""
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "📋 Created .env from .env.example"
  echo "⚠️  Please edit .env and add your MONGODB_URI, JWT_SECRET, and OPENAI_API_KEY"
fi

# Ensure logo is in public
if [ -f assets/bluelogo.png ]; then
  cp assets/bluelogo.png client/public/bluelogo.png
  echo "✅ Logo copied to client/public/"
else
  echo "⚠️  Place your bluelogo.png in assets/ and client/public/"
fi

# Copy emotion PNGs to client/public/emotions
echo ""
EMOTIONS=("angry" "confident" "embarrassed" "happy" "loved" "playful" "sad" "scared")
MISSING=()
for emotion in "${EMOTIONS[@]}"; do
  src="assets/emotions/${emotion}.png"
  dst="client/public/emotions/${emotion}.png"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
  else
    MISSING+=("${emotion}.png")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "✅ All 8 emotion PNGs copied to client/public/emotions/"
else
  echo "⚠️  Missing emotion PNGs in assets/emotions/ — please add:"
  for f in "${MISSING[@]}"; do
    echo "     ${f}"
  done
  echo "   Then copy them to client/public/emotions/ as well."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run in development:"
echo "  npm start"
echo ""
echo "To build executable:"
echo "  npm run make"
