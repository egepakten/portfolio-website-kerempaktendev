import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface GenerateCoverRequest {
  title: string;
  category?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { title, category }: GenerateCoverRequest = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const replicateToken = Deno.env.get("REPLICATE_API_TOKEN");
    
    if (!replicateToken) {
      console.warn("REPLICATE_API_TOKEN not set, returning placeholder");
      return new Response(
        JSON.stringify({ 
          success: true, 
          url: `https://via.placeholder.com/1200x630?text=${encodeURIComponent(title)}`,
          message: "Using placeholder image - set REPLICATE_API_TOKEN for AI-generated covers"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Call Replicate API to generate image
    const prompt = `A professional blog cover image for an article titled "${title}"${category ? ` about ${category}` : ''}. Modern, clean design with typography. 1200x630 pixels.`;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bea92f6",
        input: {
          prompt: prompt,
          width: 1200,
          height: 630,
          num_outputs: 1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.output?.[0];

    if (!imageUrl) {
      throw new Error("No image URL returned from Replicate");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: imageUrl,
        message: "Cover image generated successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error generating cover image:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

