#!/bin/bash

# 🚀 Deploy Script for Vattu Management System
# This script helps deploy to various platforms

echo "🚀 Vattu Management System - Deploy Script"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Vattu Management System"
    echo "✅ Git initialized"
    echo ""
fi

# Show menu
echo "Chọn nền tảng deploy:"
echo "1. Vercel (Recommended - Dễ nhất)"
echo "2. Netlify"
echo "3. Firebase Hosting"
echo "4. GitHub Pages"
echo "5. Deploy tất cả (Vercel + Netlify)"
echo ""
read -p "Nhập lựa chọn (1-5): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "📦 Installing Vercel CLI..."
            npm install -g vercel
        fi
        vercel --prod
        ;;
    2)
        echo "🚀 Deploying to Netlify..."
        if ! command -v netlify &> /dev/null; then
            echo "📦 Installing Netlify CLI..."
            npm install -g netlify-cli
        fi
        netlify deploy --prod
        ;;
    3)
        echo "🚀 Deploying to Firebase Hosting..."
        if ! command -v firebase &> /dev/null; then
            echo "📦 Installing Firebase CLI..."
            npm install -g firebase-tools
        fi
        firebase login
        firebase deploy --only hosting
        ;;
    4)
        echo "🚀 Preparing for GitHub Pages..."
        git add .
        git commit -m "🚀 Deploy to GitHub Pages"
        echo "✅ Code đã được commit"
        echo "📝 Bước tiếp theo:"
        echo "   1. Push code lên GitHub: git push origin main"
        echo "   2. Vào GitHub repository > Settings > Pages"
        echo "   3. Chọn branch: main, folder: / (root)"
        echo "   4. Save và đợi 5-10 phút"
        ;;
    5)
        echo "🚀 Deploying to Vercel and Netlify..."
        if ! command -v vercel &> /dev/null; then
            npm install -g vercel
        fi
        if ! command -v netlify &> /dev/null; then
            npm install -g netlify-cli
        fi
        echo "Deploying to Vercel..."
        vercel --prod
        echo "Deploying to Netlify..."
        netlify deploy --prod
        ;;
    *)
        echo "❌ Lựa chọn không hợp lệ"
        exit 1
        ;;
esac

echo ""
echo "✅ Deploy hoàn tất!"
echo "🌐 Kiểm tra website của bạn tại URL được cung cấp"

