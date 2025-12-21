import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  owner: { login: string };
  visibility: string;
  language: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json().catch(() => ({} as any));
    const { action, token, owner, repo, repoId, forceRefresh, branch } = payload ?? {};

    const normalizedAction = typeof action === 'string' ? action.trim().toLowerCase() : '';

    console.log('github-api request', {
      action,
      normalizedAction,
      owner,
      repo,
      repoId,
      forceRefresh,
      branch,
      hasToken: !!token,
    });

    // Cache duration: 1 hour for most data
    const CACHE_DURATION_MS = 60 * 60 * 1000;

    const getCachedData = async (repoIdNum: number, cacheType: string) => {
      if (forceRefresh) return null;
      
      const { data } = await supabaseClient
        .from('github_cache')
        .select('data, cached_at')
        .eq('repo_id', repoIdNum)
        .eq('cache_type', cacheType)
        .maybeSingle();

      if (data) {
        const cachedAt = new Date(data.cached_at).getTime();
        if (Date.now() - cachedAt < CACHE_DURATION_MS) {
          return data.data;
        }
      }
      return null;
    };

    const setCachedData = async (repoIdNum: number, cacheType: string, data: any) => {
      await supabaseClient
        .from('github_cache')
        .upsert({
          repo_id: repoIdNum,
          cache_type: cacheType,
          data: data,
          cached_at: new Date().toISOString(),
        }, { onConflict: 'repo_id,cache_type' });
    };

    const githubFetch = async (url: string, githubToken: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-Projects-App',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API error:', response.status, errorText);
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }
      
      return response;
    };

    if (!normalizedAction) {
      return new Response(
        JSON.stringify({
          error: 'Missing action',
          allowed_actions: [
            'list_repos',
            'get_languages',
            'get_readme',
            'get_projects',
            'get_branches',
            'get_commits',
            'get_project_board',
          ],
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (normalizedAction) {
      case 'list_repos': {
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'GitHub token required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Use a special cache key for user repos (use hash of token for uniqueness)
        const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
        const tokenHashHex = Array.from(new Uint8Array(tokenHash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
        const cacheKey = parseInt(tokenHashHex, 16) % 2147483647; // Convert to a positive integer for repo_id
        
        // Check cache first (5 minute cache for repos list)
        if (!forceRefresh) {
          const { data: cachedData } = await supabaseClient
            .from('github_cache')
            .select('data, cached_at')
            .eq('repo_id', cacheKey)
            .eq('cache_type', 'projects')
            .maybeSingle();

          if (cachedData) {
            const cachedAt = new Date(cachedData.cached_at).getTime();
            const REPOS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
            if (Date.now() - cachedAt < REPOS_CACHE_DURATION) {
              console.log('Returning cached repos list');
              return new Response(
                JSON.stringify({ repos: cachedData.data, cached: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }

        const response = await githubFetch(
          'https://api.github.com/user/repos?per_page=100&sort=updated',
          token
        );
        const repos: GitHubRepo[] = await response.json();
        
        const mappedRepos = repos.map(r => ({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          html_url: r.html_url,
          description: r.description,
          owner: r.owner.login,
          visibility: r.visibility,
          language: r.language,
        }));

        // Cache the result
        await supabaseClient
          .from('github_cache')
          .upsert({
            repo_id: cacheKey,
            cache_type: 'projects',
            data: mappedRepos,
            cached_at: new Date().toISOString(),
          }, { onConflict: 'repo_id,cache_type' });

        return new Response(
          JSON.stringify({ repos: mappedRepos }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_languages': {
        if (!token || !owner || !repo || !repoId) {
          return new Response(
            JSON.stringify({ error: 'token, owner, repo, and repoId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check cache first
        const cached = await getCachedData(repoId, 'languages');
        if (cached) {
          return new Response(
            JSON.stringify({ languages: cached }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await githubFetch(
          `https://api.github.com/repos/${owner}/${repo}/languages`,
          token
        );
        const languages = await response.json();
        
        // Cache the result
        await setCachedData(repoId, 'languages', languages);

        return new Response(
          JSON.stringify({ languages }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_readme': {
        if (!token || !owner || !repo || !repoId) {
          return new Response(
            JSON.stringify({ error: 'token, owner, repo, and repoId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check cache first
        const cached = await getCachedData(repoId, 'readme');
        if (cached) {
          return new Response(
            JSON.stringify({ readme: cached }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/readme`,
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3.raw',
                'User-Agent': 'Lovable-Projects-App',
              },
            }
          );
          
          if (!response.ok) {
            return new Response(
              JSON.stringify({ readme: null }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const readme = await response.text();
          
          // Cache the result
          await setCachedData(repoId, 'readme', readme);

          return new Response(
            JSON.stringify({ readme }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ readme: null }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_projects': {
        if (!token || !owner || !repo || !repoId) {
          return new Response(
            JSON.stringify({ error: 'token, owner, repo, and repoId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check cache first
        const cached = await getCachedData(repoId, 'projects');
        if (cached) {
          return new Response(
            JSON.stringify({ projects: cached }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/projects`,
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.inertia-preview+json',
                'User-Agent': 'Lovable-Projects-App',
              },
            }
          );
          
          if (!response.ok) {
            return new Response(
              JSON.stringify({ projects: [] }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const projects = await response.json();
          
          // Cache the result
          await setCachedData(repoId, 'projects', projects);

          return new Response(
            JSON.stringify({ projects }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ projects: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_branches': {
        if (!token || !owner || !repo) {
          return new Response(
            JSON.stringify({ error: 'token, owner, and repo required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const response = await githubFetch(
            `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
            token
          );
          const rawBranches = await response.json();
          const branches = rawBranches.map((b: any) => ({
            name: b.name,
            protected: b.protected,
          }));

          return new Response(
            JSON.stringify({ branches }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching branches:', error);
          return new Response(
            JSON.stringify({ branches: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_commits': {
        if (!token || !owner || !repo || !repoId) {
          return new Response(
            JSON.stringify({ error: 'token, owner, repo, and repoId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const selectedBranch = branch || 'main';

        try {
          // Fetch commits from the last 90 days for the selected branch
          const since = new Date();
          since.setDate(since.getDate() - 90);
          
          const response = await githubFetch(
            `https://api.github.com/repos/${owner}/${repo}/commits?sha=${selectedBranch}&per_page=100&since=${since.toISOString()}`,
            token
          );
          
          const rawCommits = await response.json();
          
          // Transform commits to the format we need
          const commits = rawCommits.map((c: any) => ({
            sha: c.sha,
            message: c.commit.message,
            author_date: c.commit.author.date,
            html_url: c.html_url,
            author_name: c.commit.author.name,
          }));

          return new Response(
            JSON.stringify({ commits, branch: selectedBranch }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching commits:', error);
          return new Response(
            JSON.stringify({ commits: [], branch: selectedBranch }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_commits_by_date': {
        if (!token || !owner || !repo) {
          return new Response(
            JSON.stringify({ error: 'token, owner, repo required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { since, until } = payload;
        const selectedBranch = branch || 'main';

        try {
          let url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${selectedBranch}&per_page=100`;
          if (since) url += `&since=${since}`;
          if (until) url += `&until=${until}`;
          
          const response = await githubFetch(url, token);
          const rawCommits = await response.json();
          
          const commits = rawCommits.map((c: any) => ({
            sha: c.sha,
            message: c.commit.message,
            author_date: c.commit.author.date,
            html_url: c.html_url,
            author_name: c.commit.author.name,
          }));

          return new Response(
            JSON.stringify({ commits, branch: selectedBranch }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching commits by date:', error);
          return new Response(
            JSON.stringify({ commits: [], branch: selectedBranch }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_commit_details': {
        if (!token || !owner || !repo) {
          return new Response(
            JSON.stringify({ error: 'token, owner, repo required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { sha } = payload;
        if (!sha) {
          return new Response(
            JSON.stringify({ error: 'sha required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const response = await githubFetch(
            `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
            token
          );
          const commit = await response.json();

          const files = (commit.files || []).map((f: any) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            changes: f.changes,
            patch_url: f.blob_url,
            raw_url: f.raw_url,
          }));

          return new Response(
            JSON.stringify({
              sha: commit.sha,
              message: commit.commit.message,
              author_date: commit.commit.author.date,
              html_url: commit.html_url,
              files,
              stats: commit.stats,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching commit details:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch commit details' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_project_board': {
        if (!token || !owner) {
          return new Response(
            JSON.stringify({ error: 'token and owner required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          // Use GitHub GraphQL API to get Projects V2 data
          const graphqlQuery = `
            query($owner: String!, $repo: String!) {
              repository(owner: $owner, name: $repo) {
                projectsV2(first: 5) {
                  nodes {
                    id
                    title
                    number
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
                                ... on ProjectV2FieldCommon {
                                  name
                                }
                              }
                            }
                            ... on ProjectV2ItemFieldNumberValue {
                              number
                              field {
                                ... on ProjectV2FieldCommon {
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
                            labels(first: 10) {
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
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `;

          const graphqlResponse = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
              'Authorization': `bearer ${token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Lovable-Projects-App',
            },
            body: JSON.stringify({
              query: graphqlQuery,
              variables: { owner, repo },
            }),
          });

          const graphqlResult = await graphqlResponse.json();
          console.log('GraphQL result:', JSON.stringify(graphqlResult, null, 2));

          if (graphqlResult.errors) {
            console.error('GraphQL errors:', graphqlResult.errors);
            return new Response(
              JSON.stringify({ board: null, error: graphqlResult.errors[0]?.message }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const projects = graphqlResult.data?.repository?.projectsV2?.nodes || [];
          
          if (projects.length === 0) {
            return new Response(
              JSON.stringify({ board: null }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Use the first project
          const project = projects[0];
          
          // Find the Status field
          const statusField = project.fields.nodes.find((f: any) => 
            f.name === 'Status' && f.options
          );

          const columns = statusField?.options || [];
          
          // Map items to their columns
          const items = project.items.nodes.map((item: any) => {
            const fieldValues = item.fieldValues.nodes;
            const statusValue = fieldValues.find((fv: any) => 
              fv.field?.name === 'Status'
            );
            const priorityValue = fieldValues.find((fv: any) => 
              fv.field?.name === 'Priority'
            );
            const estimateValue = fieldValues.find((fv: any) => 
              fv.field?.name === 'Estimate'
            );

            return {
              id: item.id,
              status: statusValue?.name || 'No Status',
              priority: priorityValue?.name,
              estimate: estimateValue?.number,
              content: item.content,
            };
          });

          const board = {
            title: project.title,
            columns: columns.map((col: any) => ({
              id: col.id,
              name: col.name,
              color: col.color,
              items: items.filter((item: any) => item.status === col.name),
            })),
          };

          return new Response(
            JSON.stringify({ board }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching project board:', error);
          return new Response(
            JSON.stringify({ board: null, error: error instanceof Error ? error.message : 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in github-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});