#!/bin/bash

# Deploy Supabase Edge Functions
echo "🚀 Deploying Supabase Edge Functions..."

# Deploy welcome email function
echo "📧 Deploying send-welcome-email..."
supabase functions deploy send-welcome-email

# Deploy admin notification function
echo "📧 Deploying notify-admin-new-subscriber..."
supabase functions deploy notify-admin-new-subscriber

echo "✅ All functions deployed successfully!"
echo ""
echo "⚠️  Remember to set these environment variables in Supabase Dashboard:"
echo "   - RESEND_API_KEY (required for sending emails)"
echo "   - SITE_URL (optional, defaults to https://kerempakten.dev)"
echo ""
echo "📍 Set them at: Supabase Dashboard → Project Settings → Edge Functions → Secrets"
