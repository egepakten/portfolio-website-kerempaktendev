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

// Try Imagen 4 first (dedicated image model), fallback to Gemini 2.5 Flash Image
async function generateWithImagen(apiKey: string, prompt: string): Promise<string | null> {
  console.log("Trying Imagen 4...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
          personGeneration: "dont_allow"
        }
      }),
    }
  );

  console.log("Imagen response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Imagen error:", errorText);
    return null;
  }

  const data = await response.json();
  console.log("Imagen response keys:", Object.keys(data));

  // Imagen returns predictions array with bytesBase64Encoded
  if (data.predictions?.[0]?.bytesBase64Encoded) {
    const base64 = data.predictions[0].bytesBase64Encoded;
    console.log("Imagen generated image, base64 length:", base64.length);
    return `data:image/png;base64,${base64}`;
  }

  return null;
}

async function generateWithGeminiFlash(apiKey: string, prompt: string): Promise<string | null> {
  console.log("Trying Gemini 2.5 Flash Image...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-native-image:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"]
        }
      }),
    }
  );

  console.log("Gemini Flash response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini Flash error:", errorText);
    return null;
  }

  const data = await response.json();
  console.log("Gemini Flash response keys:", Object.keys(data));

  // Extract image from Gemini response
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const base64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        console.log("Gemini Flash generated image, base64 length:", base64.length);
        return `data:${mimeType};base64,${base64}`;
      }
    }
  }

  return null;
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
        { status: 400, headers: corsHeaders }
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      console.warn("GEMINI_API_KEY not set, returning placeholder");
      return new Response(
        JSON.stringify({
          success: true,
          imageUrl: `https://placehold.co/1200x630?text=${encodeURIComponent(title)}`,
          message: "Using placeholder image - set GEMINI_API_KEY for AI-generated covers"
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Create prompt for image generation - optimized for blog covers
    const prompt = `Create a visually stunning blog cover image for "${title}"${category ? ` in the ${category} category` : ''}.
Style: Modern, vibrant, professional tech blog aesthetic similar to DEV.to covers.
Requirements: Abstract or thematic illustration, colorful gradients, geometric shapes, NO text or letters in the image.
Mood: Inspiring, innovative, technical excellence.`;

    console.log("=== Cover Image Generation ===");
    console.log("Title:", title);
    console.log("Prompt:", prompt);

    let imageUrl: string | null = null;

    // Try Imagen 4 first (best quality for dedicated image generation)
    imageUrl = await generateWithImagen(geminiApiKey, prompt);

    // Fallback to Gemini 2.5 Flash Image if Imagen fails
    if (!imageUrl) {
      console.log("Imagen failed, trying Gemini Flash...");
      imageUrl = await generateWithGeminiFlash(geminiApiKey, prompt);
    }

    if (!imageUrl) {
      console.warn("All image generation methods failed, using placeholder");
      return new Response(
        JSON.stringify({
          success: true,
          imageUrl: `https://placehold.co/1200x630?text=${encodeURIComponent(title)}`,
          message: "Using placeholder - image generation unavailable"
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log("Successfully generated cover image!");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        message: "Cover image generated successfully"
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("Error in generate-cover-image:", error.message);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: "https://placehold.co/1200x630?text=Blog+Cover",
        message: "Using placeholder image"
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});
