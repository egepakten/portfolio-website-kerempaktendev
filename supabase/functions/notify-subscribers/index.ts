import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    return new Response(null, { headers: corsHeaders });
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

    const siteUrl = Deno.env.get("SITE_URL") || "https://knakntixiudgwxudqqyw.lovableproject.com";
    const postUrl = `${siteUrl}/posts/${postSlug}`;

    const coverImageHtml = postCoverImage ? `
      <tr>
        <td style="padding: 0;">
          <a href="${postUrl}" style="display: block;">
            <img src="${postCoverImage}" alt="${postTitle}" style="width: 100%; height: auto; display: block;" />
          </a>
        </td>
      </tr>
    ` : '';

    const categoryBadge = postCategory ? `
      <span style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        ${postCategory}
      </span>
    ` : '';

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Resend has a per-second rate limit; sending sequentially avoids 429s.
    const results: { email: string; success: boolean; error?: unknown }[] = [];

    for (const recipient of recipients) {
      const personalizedName = recipient.name || "Reader";
      const subjectPrefix = isTestMode ? "[TEST] " : "";

      // small delay between sends to stay under provider rate limits
      if (!isTestMode) {
        await sleep(650);
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "Kerem's Blog <noreply@kerempakten.dev>",
          to: [recipient.email],
          subject: `${subjectPrefix}📝 New Post: ${postTitle}`,
          html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>New Post: ${postTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light only; }
    @media (prefers-color-scheme: dark) {
      body, table, td, div, p, h1, h2, h3, span, a { background-color: #ffffff !important; color: #1f2937 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa !important; color: #1f2937 !important;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
    
    <tr>
      <td style="padding: 32px 30px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #f3f4f6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center;">
              <div style="display: inline-block; background-color: #22c55e; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-weight: bold; color: #ffffff; font-size: 18px;">KP</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 16px; text-align: center;">
              <h1 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">Kerem Pakten Dev/h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${coverImageHtml}
    
    <tr>
      <td style="padding: 32px 30px;">
        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
          Hi ${personalizedName}! 👋
        </p>
        
        <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
          I just published a new post that I think you'll find interesting:
        </p>
        
        <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 0 0 24px 0; border: 1px solid #e5e7eb;">
          ${categoryBadge}
          <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 22px; font-weight: 700; line-height: 1.3;">
            ${postTitle}
          </h2>
          <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
            ${postExcerpt || "Click below to read the full article."}
          </p>
        </div>
        
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="border-radius: 10px; background-color: #22c55e;">
              <a href="${postUrl}" style="display: inline-block; padding: 14px 32px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 600;">
                Read the Full Post →
              </a>
            </td>
          </tr>
        </table>
        
        <p style="margin: 32px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
          Happy reading!<br><br>
          <strong style="color: #111827;">— Kerem</strong>
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 24px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-align: center;">
          You're receiving this because you subscribed to Kerem Pakten's Blog.
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
          <a href="${siteUrl}/settings" style="color: #22c55e; text-decoration: none; font-weight: 500;">Manage preferences</a>
          &nbsp;&nbsp;•&nbsp;&nbsp;
          <a href="${siteUrl}/posts" style="color: #22c55e; text-decoration: none; font-weight: 500;">View all posts</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });

        // Resend returns { data, error } (it doesn't always throw). Treat provider errors as failures.
        if (emailResponse?.error) {
          console.error(`Failed to send email to ${recipient.email}:`, emailResponse.error);
          results.push({ email: recipient.email, success: false, error: emailResponse.error });

          // Note: sending sequentially with a delay should prevent rate limits.
          // If you still hit 429s, we can add a proper retry using the same HTML payload.

        } else {
          console.log(`Email sent to ${recipient.email}:`, emailResponse);
          results.push({ email: recipient.email, success: true });
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        results.push({ email: recipient.email, success: false, error: emailError });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`Notification complete: ${successCount} sent, ${failCount} failed${isTestMode ? ' (TEST MODE)' : ''}`);

    // Record notification history
    const { error: historyError } = await supabase
      .from('post_notification_history')
      .insert({
        post_id: postId,
        sent_at: new Date().toISOString(),
        recipient_count: recipients.length,
        success_count: successCount,
        failed_count: failCount,
        is_test: isTestMode,
        test_email: isTestMode ? testEmail : null,
      });

    if (historyError) {
      console.error('Failed to record notification history:', historyError);
    } else {
      console.log(`Recorded notification history for post ${postId}`);
    }

    // Update post with notification info (only for non-test sends)
    if (!isTestMode && successCount > 0) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          last_notified_at: new Date().toISOString(),
          notified_subscriber_count: successCount,
        })
        .eq('id', postId);
      
      if (updateError) {
        console.error('Failed to update post notification info:', updateError);
      } else {
        console.log(`Updated post ${postId} with notification info`);
      }
    }

    return new Response(
      JSON.stringify({
        message: isTestMode ? `Test email sent successfully` : `Notifications sent successfully`,
        sent: successCount,
        failed: failCount,
        total: recipients.length,
        testMode: isTestMode,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-subscribers function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
