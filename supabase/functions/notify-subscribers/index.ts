import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface NotifyRequest {
  postId: string;
  postTitle: string;
  postExcerpt: string;
  postSlug: string;
  postCoverImage?: string;
  postCategory?: string;
  testEmail?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { postId, postTitle, postExcerpt, postSlug, postCoverImage, postCategory, testEmail }: NotifyRequest = await req.json();
    
    const isTestMode = !!testEmail;
    console.log(`Starting notification for post: ${postTitle} (${postId})`);
    console.log(`Test mode: ${isTestMode}${isTestMode ? ` - sending to ${testEmail}` : ''}`);

    let recipients: { email: string; name: string | null }[] = [];
    
    if (isTestMode) {
      recipients = [{ email: testEmail, name: 'Admin' }];
    } else {
      const { data: subscribers, error: subscribersError } = await supabase
        .from("subscribers")
        .select("email, name")
        .eq("is_active", true);

      if (subscribersError) {
        throw new Error("Failed to fetch subscribers");
      }

      if (!subscribers || subscribers.length === 0) {
        return new Response(
          JSON.stringify({ message: "No active subscribers to notify", sent: 0 }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      recipients = subscribers;
    }

    console.log(`Sending to ${recipients.length} recipient(s)`);

    const siteUrl = Deno.env.get("SITE_URL") || "https://kerempakten.dev";
    const postUrl = `${siteUrl}/posts/${postSlug}`;

    const categoryBadge = postCategory ? `
      <span style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        ${postCategory}
      </span>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${postTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0;">
          <!-- Header - Light mint green background -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #dcfce7;">
              <h1 style="margin: 0; color: #166534; font-size: 24px; font-weight: 700;">New Post Published! 📝</h1>
            </td>
          </tr>

          <!-- Cover Image with rounded corners -->
          ${postCoverImage ? `
          <tr>
            <td style="padding: 24px 30px 0 30px;">
              <a href="${postUrl}" style="display: block;">
                <img src="${postCoverImage}" alt="${postTitle}" style="width: 100%; height: auto; display: block; border-radius: 12px; border: 1px solid #e2e8f0;" />
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 30px;">
              ${categoryBadge}

              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 26px; font-weight: 700; line-height: 1.3;">
                ${postTitle}
              </h2>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
                ${postExcerpt}
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${postUrl}" style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Read Full Post →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer - Light background -->
          <tr>
            <td style="padding: 24px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-align: center;">
                You're receiving this because you subscribed to Kerem's Blog.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
                <a href="${siteUrl}/settings" style="color: #16a34a; text-decoration: none;">Manage preferences</a>
                &nbsp;|&nbsp;
                <a href="${siteUrl}" style="color: #16a34a; text-decoration: none;">Visit blog</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: "Kerem's Blog <noreply@kerempakten.dev>",
          to: [recipient.email],
          subject: `New Post: ${postTitle}`,
          html: emailHtml,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        failedCount++;
      }
    }

    // Record notification in database
    if (!isTestMode) {
      await supabase
        .from("post_notification_history")
        .insert({
          post_id: postId,
          recipient_count: recipients.length,
          success_count: successCount,
          failed_count: failedCount,
          is_test: false,
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent: ${successCount} successful, ${failedCount} failed`,
        sent: successCount,
        failed: failedCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});