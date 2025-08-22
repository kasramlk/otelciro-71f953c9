import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { 
      hotelId, 
      prompt, 
      tone = 'professional', 
      platform = 'instagram', 
      contentType = 'post',
      language = 'en',
      includeHashtags = true,
      pmsData = {},
      brandVoice = {}
    } = await req.json();

    console.log('Generating social content for hotel:', hotelId);

    // Get hotel and brand kit information
    const { data: hotel } = await supabase
      .from('hotels')
      .select('name, city, country')
      .eq('id', hotelId)
      .single();

    const { data: brandKit } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Build context for AI
    const hotelContext = hotel ? `Hotel: ${hotel.name} in ${hotel.city}, ${hotel.country}` : '';
    const brandContext = brandKit ? `Brand voice: ${brandKit.brand_voice?.tone || 'professional'}, ${brandKit.brand_voice?.style || 'modern'}` : '';
    
    // Create tone-specific instructions
    const toneInstructions = {
      luxury: "Write in an elegant, sophisticated tone with premium language. Use refined vocabulary and emphasize exclusivity.",
      boutique: "Write in a personal, intimate tone that highlights unique character and personalized service.",
      family: "Write in a warm, welcoming tone that appeals to families. Use friendly, approachable language.",
      budget: "Write in a practical, value-focused tone that emphasizes affordability and good deals.",
      trendy: "Write in a modern, energetic tone using current language and trends. Be engaging and dynamic.",
      professional: "Write in a polished, business-appropriate tone that conveys trust and reliability."
    };

    // Platform-specific instructions
    const platformInstructions = {
      instagram: "Optimize for Instagram: visual storytelling, engaging captions, use emojis appropriately",
      facebook: "Optimize for Facebook: informative, community-focused, encourage engagement",
      tiktok: "Optimize for TikTok: trendy, energetic, use current slang and hashtags",
      linkedin: "Optimize for LinkedIn: professional, business-focused, industry insights",
      twitter: "Optimize for Twitter: concise, engaging, newsworthy angle"
    };

    // Language-specific instructions
    const languageInstructions = {
      en: "Write in English",
      tr: "Write in Turkish (Türkçe)",
      de: "Write in German (Deutsch)", 
      ru: "Write in Russian (Русский)",
      ar: "Write in Arabic (العربية)"
    };

    // Build the AI prompt
    const systemPrompt = `You are a social media content creator for hotels. Create engaging social media content based on the following:

${hotelContext}
${brandContext}
Platform: ${platform}
Content Type: ${contentType}
Tone: ${tone}
Language: ${language}

Instructions:
- ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}
- ${platformInstructions[platform as keyof typeof platformInstructions]}
- ${languageInstructions[language as keyof typeof languageInstructions]}
- Keep content authentic and relevant to hospitality industry
- If PMS data is provided, incorporate relevant details naturally
${includeHashtags ? '- Include 5-10 relevant hashtags at the end' : '- Do not include hashtags'}

PMS Data Context: ${JSON.stringify(pmsData)}

Return ONLY the social media caption/content, nothing else.`;

    console.log('Calling OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated content successfully');

    // Extract hashtags if present
    const hashtagRegex = /#\w+/g;
    const hashtags = generatedContent.match(hashtagRegex) || [];
    const caption = generatedContent.replace(hashtagRegex, '').trim();

    // Create content record in database
    const { data: contentRecord, error: createError } = await supabase
      .from('social_content')
      .insert([{
        hotel_id: hotelId,
        caption: caption,
        hashtags: hashtags.map((tag: string) => tag.replace('#', '')),
        platform: platform,
        content_type: contentType,
        media_urls: [],
        status: 'draft',
        language: language,
        ai_metadata: {
          prompt: prompt,
          tone: tone,
          generated_at: new Date().toISOString(),
          model: 'gpt-4o-mini'
        },
        pms_data: pmsData
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error saving content:', createError);
      throw createError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: {
          id: contentRecord.id,
          caption: caption,
          hashtags: hashtags,
          platform: platform,
          contentType: contentType,
          language: language,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-social-content function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});