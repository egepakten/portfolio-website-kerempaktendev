#!/bin/bash

# Deploy Supabase Edge Functions
echo "🚀 Deploying Supabase Edge Functions..."

# Deploy welcome email function
echo "📧 Deploying send-welcome-email..."
supabase functions deploy send-welcome-email

# Deploy admin notification function
echo "📧 Deploying notify-admin-new-subscriber..."
supabase functions deploy notify-admin-new-subscriber

# Deploy account deletion notification function
echo "📧 Deploying notify-admin-account-deleted..."
supabase functions deploy notify-admin-account-deleted

# Deploy account deletion confirmation to user
echo "📧 Deploying send-account-deletion-confirmation..."
supabase functions deploy send-account-deletion-confirmation

echo "✅ All functions deployed successfully!"
echo ""
echo "⚠️  Remember to set these environment variables in Supabase Dashboard:"
echo "   - RESEND_API_KEY (required for sending emails)"
echo "   - SITE_URL (optional, defaults to https://kerempakten.dev)"
echo "   - SUPABASE_URL (required for subscriber count)"
echo "   - SUPABASE_SERVICE_ROLE_KEY (required for subscriber count)"
echo ""
echo "📍 Set them at: Supabase Dashboard → Project Settings → Edge Functions → Secrets"
