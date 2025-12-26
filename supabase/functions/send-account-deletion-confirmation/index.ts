import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface DeletionConfirmationRequest {
  userEmail: string;
  username?: string;
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
    const { userEmail, username }: DeletionConfirmationRequest = await req.json();

    console.log(`Sending account deletion confirmation to: ${userEmail}`);

    const displayName = username || "there";
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const emailResponse = await resend.emails.send({
      from: "Kerem Pakten Dev <noreply@kerempakten.dev>",
      to: [userEmail],
      subject: "Your Account Has Been Deleted",
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
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #64748b 0%, #475569 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Account Deleted</h1>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">Goodbye, ${displayName}</h2>

                <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                  Your account has been successfully deleted from <strong>kerempakten.dev</strong>.
                </p>

                <div style="background-color: #f1f5f9; border-left: 4px solid #64748b; border-radius: 8px; padding: 24px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; color: #1e293b; font-size: 15px; font-weight: 600;">What's been deleted:</p>
                  <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                    <li>Your profile and personal information</li>
                    <li>Your subscription to blog notifications</li>
                    <li>Your comments and interactions</li>
                    <li>Your account credentials and authentication data</li>
                  </ul>
                </div>

                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                    <strong>⚠️ Important:</strong> This action is permanent and cannot be undone. All your data has been removed from our systems.
                  </p>
                </div>

                <p style="margin: 0 0 12px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                  <strong>Deleted on:</strong> ${deletedAt}
                </p>

                <p style="margin: 24px 0 0 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                  We're sorry to see you go. If you change your mind, you're always welcome to create a new account and join us again.
                </p>

                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Thank you for being part of our community. We hope to see you again in the future!
                  </p>
                  <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Best regards,<br>
                    <strong>Kerem Pakten</strong>
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 30px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #718096; font-size: 13px; text-align: center;">
                  This is an automated confirmation email. You're receiving this because you deleted your account.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Account deletion confirmation sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Deletion confirmation sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending deletion confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
