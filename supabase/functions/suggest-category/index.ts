import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content, categories } = await req.json()

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Content is required to suggest a category' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Suggesting category for content length:', content.length)

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const categoryList = categories.map((c: { name: string; id: string }) => `- ${c.name} (id: ${c.id})`).join('\n')

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that categorizes blog posts. Given the content of a blog post and a list of available categories, you must select the most appropriate category. Respond with ONLY the category ID, nothing else."
          },
          {
            role: "user",
            content: `Based on the following blog post content, select the most appropriate category from the list below.

Available categories:
${categoryList}

Blog post content:
${content.substring(0, 2000)}

Respond with ONLY the category ID (the UUID in parentheses), nothing else.`
          }
        ],
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', errorText)
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('AI response received')

    const suggestedCategoryId = data.choices?.[0]?.message?.content?.trim()
    
    if (!suggestedCategoryId) {
      throw new Error('No category suggested')
    }

    // Validate the category ID exists
    const validCategory = categories.find((c: { id: string }) => c.id === suggestedCategoryId)
    
    return new Response(
      JSON.stringify({ 
        categoryId: validCategory ? suggestedCategoryId : null,
        message: validCategory ? 'Category suggested successfully' : 'Could not match to existing category'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Error suggesting category:', error)
    const message = error instanceof Error ? error.message : 'Failed to suggest category'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
