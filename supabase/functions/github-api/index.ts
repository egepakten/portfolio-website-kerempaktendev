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

      try {
        // GitHub Projects V2 requires GraphQL API
        // First, find projects linked to this repository
        const query = `
          query($owner: String!, $repo: String!) {
            repository(owner: $owner, name: $repo) {
              projectsV2(first: 10) {
                nodes {
                  id
                  title
                  number
                  items(first: 100) {
                    nodes {
                      id
                      fieldValues(first: 10) {
                        nodes {
                          ... on ProjectV2ItemFieldSingleSelectValue {
                            name
                            field {
                              ... on ProjectV2SingleSelectField {
                                name
                              }
                            }
                          }
                          ... on ProjectV2ItemFieldTextValue {
                            text
                            field {
                              ... on ProjectV2Field {
                                name
                              }
                            }
                          }
                        }
                      }
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
                          assignees(first: 3) {
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
                          assignees(first: 3) {
                            nodes {
                              login
                              avatarUrl
                            }
                          }
                        }
                        ... on DraftIssue {
                          title
                        }
                      }
                    }
                  }
                  fields(first: 20) {
                    nodes {
                      ... on ProjectV2SingleSelectField {
                        id
                        name
                        options {
                          id
                          name
                          color
                        }
                      }
                    }
                  }
                }
              }
            }
            user(login: $owner) {
              projectsV2(first: 10) {
                nodes {
                  id
                  title
                  number
                  items(first: 100) {
                    nodes {
                      id
                      fieldValues(first: 10) {
                        nodes {
                          ... on ProjectV2ItemFieldSingleSelectValue {
                            name
                            field {
                              ... on ProjectV2SingleSelectField {
                                name
                              }
                            }
                          }
                        }
                      }
                      content {
                        ... on Issue {
                          id
                          number
                          title
                          state
                          url
                          repository {
                            name
                          }
                          labels(first: 5) {
                            nodes {
                              name
                              color
                            }
                          }
                          assignees(first: 3) {
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
                          repository {
                            name
                          }
                          labels(first: 5) {
                            nodes {
                              name
                              color
                            }
                          }
                          assignees(first: 3) {
                            nodes {
                              login
                              avatarUrl
                            }
                          }
                        }
                        ... on DraftIssue {
                          title
                        }
                      }
                    }
                  }
                  fields(first: 20) {
                    nodes {
                      ... on ProjectV2SingleSelectField {
                        id
                        name
                        options {
                          id
                          name
                          color
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        console.log("Sending GraphQL query for Projects V2...");

        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            query,
            variables: { owner, repo }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`GitHub GraphQL error (${response.status}):`, errorText);
          return new Response(
            JSON.stringify({ board: null, error: `GitHub API error: ${response.status}` }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const result = await response.json();
        console.log("GraphQL response received");

        if (result.errors) {
          console.error("GraphQL errors:", JSON.stringify(result.errors));
          return new Response(
            JSON.stringify({ board: null, error: result.errors[0]?.message }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Try to find project from repository first, then from user
        let projectNode = result.data?.repository?.projectsV2?.nodes?.[0];
        
        // If no repo-level project, check user-level projects and filter by repo name
        if (!projectNode) {
          const userProjects = result.data?.user?.projectsV2?.nodes || [];
          console.log(`Found ${userProjects.length} user-level projects`);
          
          // Find project that matches the repo name or contains items from this repo
          projectNode = userProjects.find((p: any) => {
            // Check if project title contains repo name
            if (p.title.toLowerCase().includes(repo.toLowerCase())) {
              return true;
            }
            // Check if any items are from this repo
            return p.items?.nodes?.some((item: any) => 
              item.content?.repository?.name?.toLowerCase() === repo.toLowerCase()
            );
          });
          
          // If still no match, just use the first project that has the repo name in title
          if (!projectNode) {
            projectNode = userProjects.find((p: any) => 
              p.title.toLowerCase().includes(repo.toLowerCase())
            );
          }
        }

        if (!projectNode) {
          console.log("No matching project found for repo:", repo);
          return new Response(
            JSON.stringify({ board: null }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("Found project:", projectNode.title);

        // Find the Status field and its options
        const statusField = projectNode.fields?.nodes?.find(
          (f: any) => f.name?.toLowerCase() === "status"
        );

        const statusOptions = statusField?.options || [];
        console.log("Status options:", statusOptions.map((o: any) => o.name).join(", "));

        // Create columns based on status options
        const columns: Record<string, any> = {};
        
        // Initialize columns from status field options
        statusOptions.forEach((option: any) => {
          columns[option.name] = {
            id: option.id,
            name: option.name,
            color: option.color || "GRAY",
            items: [],
          };
        });

        // Add a "No Status" column for items without status
        columns["No Status"] = {
          id: "no-status",
          name: "No Status",
          color: "GRAY",
          items: [],
        };

        // Process items and assign to columns
        projectNode.items?.nodes?.forEach((item: any) => {
          // Find the status value for this item
          const statusValue = item.fieldValues?.nodes?.find(
            (fv: any) => fv.field?.name?.toLowerCase() === "status"
          );
          
          const status = statusValue?.name || "No Status";
          
          // Make sure the column exists
          if (!columns[status]) {
            columns[status] = {
              id: status.toLowerCase().replace(/\s+/g, "-"),
              name: status,
              color: "GRAY",
              items: [],
            };
          }

          // Only add items that have content (issues/PRs)
          if (item.content && (item.content.title || item.content.number)) {
            columns[status].items.push({
              id: item.id,
              status,
              content: {
                id: item.content.id || item.id,
                number: item.content.number || 0,
                title: item.content.title || "Draft",
                state: item.content.state || "OPEN",
                url: item.content.url || "",
                labels: item.content.labels || { nodes: [] },
                assignees: item.content.assignees || { nodes: [] },
              },
            });
          }
        });

        // Remove empty "No Status" column if it has no items
        if (columns["No Status"].items.length === 0) {
          delete columns["No Status"];
        }

        // Convert to array and sort by a predefined order
        const columnOrder = ["Backlog", "Ready", "In Progress", "In progress", "In Review", "In review", "Done"];
        const sortedColumns = Object.values(columns).sort((a: any, b: any) => {
          const aIndex = columnOrder.findIndex(c => c.toLowerCase() === a.name.toLowerCase());
          const bIndex = columnOrder.findIndex(c => c.toLowerCase() === b.name.toLowerCase());
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

        const board = {
          title: projectNode.title,
          columns: sortedColumns,
        };

        console.log("Board created successfully:");
        console.log("- Title:", board.title);
        console.log("- Columns:", sortedColumns.map((c: any) => `${c.name} (${c.items.length} items)`).join(", "));

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

    if (action === "get_commits_by_date") {
      if (!owner || !repo) {
        return new Response(
          JSON.stringify({ error: "Missing owner or repo", commits: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const branch = body.branch || "main";
      const since = body.since;
      const until = body.until;

      if (!since || !until) {
        return new Response(
          JSON.stringify({ error: "Missing since or until date", commits: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&since=${since}&until=${until}&per_page=100`,
          {
            headers: {
              "Authorization": `token ${token}`,
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "KeremPaktenDev-Portfolio",
            },
          }
        );

        if (!response.ok) {
          console.warn(`Commits not found for ${owner}/${repo}/${branch}`);
          return new Response(
            JSON.stringify({ commits: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
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
      } catch (error) {
        console.error("Error fetching commits by date:", error);
        return new Response(
          JSON.stringify({ commits: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "get_commit_details") {
      if (!owner || !repo || !body.sha) {
        return new Response(
          JSON.stringify({ error: "Missing owner, repo, or sha", files: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${body.sha}`,
          {
            headers: {
              "Authorization": `token ${token}`,
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "KeremPaktenDev-Portfolio",
            },
          }
        );

        if (!response.ok) {
          console.warn(`Commit details not found for ${owner}/${repo}/${body.sha}`);
          return new Response(
            JSON.stringify({ files: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const commitData = await response.json();
        const files = (commitData.files || []).map((file: any) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patch_url: file.patch,
        }));

        return new Response(
          JSON.stringify({ files }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error fetching commit details:", error);
        return new Response(
          JSON.stringify({ files: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

