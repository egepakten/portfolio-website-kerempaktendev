import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface GitHubRequest {
  action: string;
  token: string;
  owner: string;
  repo: string;
  repoId?: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.json();
    const { action, token: bodyToken, owner, repo, repoId } = body;
    
    // Use token from body or from environment variable
    const token = bodyToken || Deno.env.get("GITHUB_TOKEN");

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!token) {
      console.error("No GitHub token provided");
      return new Response(
        JSON.stringify({ error: "Missing GitHub token. Please set GITHUB_TOKEN secret or pass token in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format (should start with 'ghp_' or 'github_pat_')
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_') && !token.startsWith('gho_')) {
      console.warn("Invalid GitHub token format:", token.substring(0, 10) + "...");
    }

    // For list_repos, owner and repo are not required
    if ((action === "get_languages" || action === "get_readme") && (!owner || !repo)) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters for this action: owner, repo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "list_repos") {
      // Fetch user's repositories from GitHub
      const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GitHub API error (${response.status}):`, errorText);
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const repos = await response.json();
      
      return new Response(
        JSON.stringify({ repos }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_languages") {
      // Check cache first
      if (repoId) {
        const { data: cached } = await supabase
          .from("github_cache")
          .select("data")
          .eq("repo_id", repoId)
          .eq("cache_type", "languages")
          .maybeSingle();

        if (cached) {
          console.log(`Using cached languages for ${owner}/${repo}`);
          return new Response(
            JSON.stringify({ languages: cached.data }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Fetch from GitHub
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Repository not found: ${owner}/${repo}`);
          return new Response(
            JSON.stringify({ languages: {} }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 401) {
          console.error("GitHub API authentication failed - invalid or expired token");
          return new Response(
            JSON.stringify({ error: "GitHub authentication failed. Please check your GitHub token." }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error(`GitHub API error (${response.status}):`, errorText);
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const languages = await response.json();

      // Cache the result
      if (repoId) {
        await supabase
          .from("github_cache")
          .upsert({
            repo_id: repoId,
            cache_type: "languages",
            data: languages,
          }, { onConflict: "repo_id,cache_type" });
      }

      return new Response(
        JSON.stringify({ languages }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_readme") {
      // Check cache first
      if (repoId) {
        const { data: cached } = await supabase
          .from("github_cache")
          .select("data")
          .eq("repo_id", repoId)
          .eq("cache_type", "readme")
          .maybeSingle();

        if (cached) {
          console.log(`Using cached README for ${owner}/${repo}`);
          return new Response(
            JSON.stringify({ readme: cached.data }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Fetch from GitHub
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3.raw",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`README not found for: ${owner}/${repo}`);
          return new Response(
            JSON.stringify({ readme: null }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 401) {
          console.error("GitHub API authentication failed - invalid or expired token");
          return new Response(
            JSON.stringify({ error: "GitHub authentication failed. Please check your GitHub token." }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error(`GitHub API error (${response.status}):`, errorText);
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const readme = await response.text();

      // Cache the result
      if (repoId) {
        await supabase
          .from("github_cache")
          .upsert({
            repo_id: repoId,
            cache_type: "readme",
            data: { content: readme },
          }, { onConflict: "repo_id,cache_type" });
      }

      return new Response(
        JSON.stringify({ readme }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in github-api:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    const statusCode = error?.status || 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error?.toString?.() 
      }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

