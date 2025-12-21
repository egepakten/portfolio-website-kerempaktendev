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
  console.log("=== GitHub API Edge Function Called ===");
  console.log("Method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { action, token: bodyToken, owner, repo, repoId } = body;
    
    // Log what we received
    console.log("Action:", action);
    console.log("Token provided:", bodyToken ? "Yes (from body)" : "No");
    console.log("Owner:", owner);
    console.log("Repo:", repo);
    
    const token = bodyToken || Deno.env.get("GITHUB_TOKEN");
    console.log("Final token source:", bodyToken ? "body" : "env");
    console.log("Token exists:", !!token);
    console.log("Token preview:", token ? `${token.substring(0, 15)}...` : "MISSING");

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!token) {
      console.error("No GitHub token provided");
      return new Response(
        JSON.stringify({ 
          error: "Missing GitHub token. Please set GITHUB_TOKEN secret or pass token in request body",
          hint: "Add GITHUB_TOKEN to Supabase Secrets"
        }),
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

    if (action === "get_branches") {
      if (!owner || !repo) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters: owner, repo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Repository not found: ${owner}/${repo}`);
          return new Response(
            JSON.stringify({ branches: [] }),
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

      const branches = await response.json();
      return new Response(
        JSON.stringify({ branches }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_commits") {
      if (!owner || !repo) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters: owner, repo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const branch = body.branch || "main";
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=100`,
        {
          headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Repository or branch not found: ${owner}/${repo}/${branch}`);
          return new Response(
            JSON.stringify({ commits: [] }),
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

      const commitsData = await response.json();
      const commits = commitsData.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author_date: commit.commit.author.date,
        html_url: commit.html_url,
        author_name: commit.commit.author.name,
      }));

      return new Response(
        JSON.stringify({ commits }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_commits_by_date") {
      if (!owner || !repo) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters: owner, repo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const branch = body.branch || "main";
      const since = body.since;
      const until = body.until;

      if (!since || !until) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters: since, until" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&since=${since}&until=${until}&per_page=100`,
        {
          headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Repository or branch not found: ${owner}/${repo}/${branch}`);
          return new Response(
            JSON.stringify({ commits: [] }),
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

      const commitsData = await response.json();
      const commits = commitsData.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author_date: commit.commit.author.date,
        html_url: commit.html_url,
        author_name: commit.commit.author.name,
      }));

      return new Response(
        JSON.stringify({ commits }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_project_board") {
      if (!owner || !repo) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters: owner, repo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Fetching project board for ${owner}/${repo}`);

      // Use GraphQL to fetch project board - simple query that works
      const query = `
        query {
          repository(owner: "${owner}", name: "${repo}") {
            projectsV2(first: 1) {
              nodes {
                id
                title
                items(first: 100) {
                  nodes {
                    id
                    content {
                      ... on Issue {
                        id
                        number
                        title
                        state
                        url
                        labels(first: 5) {
                          nodes {
                            name
                            color
                          }
                        }
                        assignees(first: 5) {
                          nodes {
                            login
                            avatarUrl
                          }
                        }
                      }
                      ... on PullRequest {
                        id
                        number
                        title
                        state
                        url
                        labels(first: 5) {
                          nodes {
                            name
                            color
                          }
                        }
                        assignees(first: 5) {
                          nodes {
                            login
                            avatarUrl
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        console.log("Sending GraphQL query to GitHub...");
        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        console.log("GraphQL response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`GitHub GraphQL error (${response.status}):`, errorText);
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const result = await response.json();
        console.log("GraphQL result:", JSON.stringify(result, null, 2));

        if (result.errors) {
          console.error("GraphQL errors:", result.errors);
          return new Response(
            JSON.stringify({ board: null, message: "Failed to fetch project board", errors: result.errors }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const projectNode = result.data?.repository?.projectsV2?.nodes?.[0];
        console.log("Project node found:", !!projectNode);
        
        if (!projectNode) {
          console.log("No project board found for this repository");
          return new Response(
            JSON.stringify({ board: null }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create columns - for now group by state (open/closed) or create a single column
        const columns: Record<string, any> = {
          "Open": {
            id: "open",
            name: "Open",
            color: "BLUE",
            items: [],
          },
          "Closed": {
            id: "closed",
            name: "Closed",
            color: "GREEN",
            items: [],
          },
        };

        projectNode.items.nodes.forEach((item: any) => {
          if (item.content) {
            const state = item.content.state === "OPEN" ? "Open" : "Closed";
            columns[state].items.push({
              id: item.id,
              status: state,
              content: {
                id: item.content.id,
                number: item.content.number,
                title: item.content.title,
                state: item.content.state,
                url: item.content.url,
                labels: {
                  nodes: item.content.labels?.nodes || [],
                },
                assignees: {
                  nodes: item.content.assignees?.nodes || [],
                },
              },
            });
          }
        });

        const board = {
          title: projectNode.title,
          columns: Object.values(columns).filter((col: any) => col.items.length > 0),
        };

        console.log("Board created with", board.columns.length, "columns");
        console.log("Total items:", board.columns.reduce((sum: number, col: any) => sum + col.items.length, 0));
        
        return new Response(
          JSON.stringify({ board }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error: any) {
        console.error("Error fetching project board:", error);
        return new Response(
          JSON.stringify({ board: null, error: error.message }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
            data: readme,
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

