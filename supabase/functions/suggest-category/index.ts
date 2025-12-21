import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface SuggestCategoryRequest {
  title: string;
  excerpt?: string;
  content?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { title, excerpt, content }: SuggestCategoryRequest = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, slug");

    if (categoriesError) {
      throw new Error("Failed to fetch categories");
    }

    // Simple keyword-based category suggestion
    const text = `${title} ${excerpt || ''} ${content || ''}`.toLowerCase();
    const categoryKeywords: Record<string, string[]> = {
      "Technology": ["tech", "software", "code", "programming", "development", "javascript", "typescript", "react", "node"],
      "Cloud": ["cloud", "aws", "azure", "gcp", "devops", "docker", "kubernetes", "infrastructure"],
      "Web Development": ["web", "frontend", "backend", "fullstack", "html", "css", "api", "rest"],
      "AI & Machine Learning": ["ai", "machine learning", "ml", "neural", "deep learning", "nlp", "gpt"],
      "Database": ["database", "sql", "nosql", "postgres", "mongodb", "redis", "data"],
      "Security": ["security", "encryption", "auth", "authentication", "privacy", "ssl", "https"],
    };

    let suggestedCategory = "Technology"; // Default
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        suggestedCategory = category;
      }
    }

    // Find matching category in database
    const matchedCategory = categories?.find(
      cat => cat.name.toLowerCase() === suggestedCategory.toLowerCase()
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggested_category: suggestedCategory,
        category_id: matchedCategory?.id || null,
        confidence: maxMatches > 0 ? "high" : "low",
        available_categories: categories?.map(c => ({ id: c.id, name: c.name })) || []
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error suggesting category:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

