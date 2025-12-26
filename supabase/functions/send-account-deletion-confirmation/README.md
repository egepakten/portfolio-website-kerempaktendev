# Account Deletion Confirmation Email

This Supabase Edge Function sends a confirmation email to users when they delete their account.

## Setup

1. Make sure you have the `RESEND_API_KEY` environment variable set in your Supabase project

2. Deploy the function:

```bash
supabase functions deploy send-account-deletion-confirmation
```

After deployment, set the environment variable in Supabase Dashboard → Edge Functions → Secrets

## Usage

The function is automatically called from the AuthContext when a user deletes their account.

## Request Format

```json
{
  "userEmail": "user@example.com",
  "username": "John Doe"
}
```

## Response Format

Success:
```json
{
  "success": true,
  "message": "Deletion confirmation sent"
}
```

Error:
```json
{
  "error": "Error message"
}
```

## Email Content

The user receives a professional confirmation email with:
- Personalized greeting with their name
- Confirmation that their account has been deleted
- List of what data was removed:
  - Profile and personal information
  - Subscription to blog notifications
  - Comments and interactions
  - Account credentials and authentication data
- Deletion timestamp
- Warning that the action is permanent
- Invitation to return and create a new account in the future
- Neutral gray-themed design
