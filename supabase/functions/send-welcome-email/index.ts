import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();
    
    console.log(`Sending welcome email to: ${email}`);

    const siteUrl = Deno.env.get("SITE_URL") || "https://knakntixiudgwxudqqyw.lovableproject.com";
    const personalizedName = name || "there";

    const emailResponse = await resend.emails.send({
      from: "Kerem's Blog <noreply@kerempakten.dev>",
      to: [email],
      subject: "Welcome to Kerem's Blog! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Kerem's Blog</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome Aboard! 🚀</h1>
              </td>
            </tr>
            
            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: 600;">Hey ${personalizedName}!</h2>
                
                <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                  Thank you for subscribing to my newsletter! I'm thrilled to have you join our community of curious minds.
                </p>
                
                <div style="background-color: #f7fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <h3 style="margin: 0 0 16px 0; color: #2d3748; font-size: 18px; font-weight: 600;">What to Expect:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 1.8;">
                    <li>📚 In-depth articles on technology and development</li>
                    <li>💡 Practical tips and best practices</li>
                    <li>🔍 Deep dives into interesting topics</li>
                    <li>🎯 No spam, just valuable content</li>
                  </ul>
                </div>
                
                <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                  While you're here, why not check out some of our latest posts?
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${siteUrl}/posts" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Browse All Posts
                  </a>
                </div>
                
                <p style="margin: 24px 0 0 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                  Happy reading! 📖<br><br>
                  <strong style="color: #2d3748;">Kerem Pakten</strong>
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 30px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; color: #718096; font-size: 13px; text-align: center;">
                  You're receiving this because you subscribed to Kerem's Blog.
                </p>
                <p style="margin: 0; color: #718096; font-size: 13px; text-align: center;">
                  <a href="${siteUrl}/settings" style="color: #667eea; text-decoration: none;">Manage preferences</a>
                  &nbsp;|&nbsp;
                  <a href="${siteUrl}" style="color: #667eea; text-decoration: none;">Visit blog</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
