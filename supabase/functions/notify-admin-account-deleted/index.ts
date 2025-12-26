import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface NotifyAccountDeletedRequest {
  userEmail: string;
  username?: string;
  reason: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { userEmail, username, reason }: NotifyAccountDeletedRequest = await req.json();

    console.log(`Notifying admin about account deletion: ${userEmail}`);

    const adminEmail = "egepakten@icloud.com";
    const displayName = username || "Anonymous";
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const emailResponse = await resend.emails.send({
      from: "Blog Notifications <noreply@kerempakten.dev>",
      to: [adminEmail],
      subject: "⚠️ Account Deleted",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Deleted</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⚠️ Account Deleted</h1>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">Account Removal Notice</h2>

                <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                  A user has deleted their account from your blog.
                </p>

                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 24px; margin: 24px 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Name:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 500;">${displayName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Email:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 500;">
                        <a href="mailto:${userEmail}" style="color: #ef4444; text-decoration: none;">${userEmail}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Deleted:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 500;">${deletedAt}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600; vertical-align: top;">Reason:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 500;">${reason || 'Not specified'}</td>
                    </tr>
                  </table>
                </div>

                <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                  This deletion record has been saved in the deleted_accounts table.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 30px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #718096; font-size: 13px; text-align: center;">
                  This is an automated notification from your blog.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Admin notified about account deletion:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Admin notified about account deletion" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error notifying admin about deletion:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
