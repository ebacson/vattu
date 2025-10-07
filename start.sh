#!/bin/bash

echo "🚀 Starting Vattu Management System with Firebase Realtime Database..."

# Check if serviceAccountKey.json exists
if [ ! -f "serviceAccountKey.json" ]; then
    echo "❌ serviceAccountKey.json not found!"
    echo "📋 Please follow these steps:"
    echo "1. Go to Firebase Console → Project Settings → Service Accounts"
    echo "2. Click 'Generate new private key'"
    echo "3. Download the JSON file"
    echo "4. Rename it to 'serviceAccountKey.json'"
    echo "5. Place it in the project directory"
    echo ""
    echo "📖 See QUICK-SETUP-FIREBASE.md for detailed instructions"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test Firebase connection
echo "🔥 Testing Firebase connection..."
node test-firebase-connection.js

if [ $? -eq 0 ]; then
    echo "✅ Firebase connection test passed!"
    echo ""
    echo "🚀 Starting servers..."
    echo "📊 Excel Server: http://localhost:3002"
    echo "🌐 Web App: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    
    # Start Excel server in background
    npm start &
    EXCEL_PID=$!
    
    # Start static server in background
    python3 -m http.server 8000 &
    STATIC_PID=$!
    
    # Function to cleanup on exit
    cleanup() {
        echo ""
        echo "🛑 Stopping servers..."
        kill $EXCEL_PID 2>/dev/null
        kill $STATIC_PID 2>/dev/null
        echo "✅ Servers stopped"
        exit 0
    }
    
    # Trap Ctrl+C
    trap cleanup SIGINT
    
    # Wait for background processes
    wait
    
else
    echo "❌ Firebase connection test failed!"
    echo "📖 Please check QUICK-SETUP-FIREBASE.md for troubleshooting"
    exit 1
fi