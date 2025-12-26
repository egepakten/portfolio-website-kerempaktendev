# Notify Admin - New Subscriber Edge Function

This Supabase Edge Function sends an email notification to the admin (egepakten@icloud.com) whenever a new user subscribes to the blog.

## Setup

1. Make sure you have the `RESEND_API_KEY` environment variable set in your Supabase project
2. Deploy the function:

```bash
supabase functions deploy notify-admin-new-subscriber
```

## Usage

The function is automatically called from the AuthContext when:
- A new user signs up
- A user confirms their email after signing up

## Request Format

```json
{
  "subscriberEmail": "user@example.com",
  "subscriberName": "John Doe"
}
```

## Response Format

Success:
```json
{
  "success": true,
  "message": "Admin notified"
}
```

Error:
```json
{
  "error": "Error message"
}
```

## Email Content

The admin receives an email with:
- Subscriber's name
- Subscriber's email address
- Timestamp of subscription
- Link to view all subscribers in the admin dashboard
