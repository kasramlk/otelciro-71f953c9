import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Social Media API configurations
const SOCIAL_APIS = {
  instagram: {
    baseUrl: 'https://graph.facebook.com/v18.0',
    // Note: Instagram Basic Display API requires Facebook/Meta app
  },
  facebook: {
    baseUrl: 'https://graph.facebook.com/v18.0',
  },
  twitter: {
    baseUrl: 'https://api.twitter.com/2',
  },
  linkedin: {
    baseUrl: 'https://api.linkedin.com/v2',
  }
};

interface PublishRequest {
  contentId: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  publishNow?: boolean;
  scheduledFor?: string;
}

async function publishToInstagram(content: any, accessToken: string) {
  // Instagram requires a two-step process for posts
  const { baseUrl } = SOCIAL_APIS.instagram;
  
  try {
    // Step 1: Create media object
    const mediaResponse = await fetch(`${baseUrl}/me/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: content.media_urls?.[0] || '',
        caption: `${content.caption}\n\n${content.hashtags.map((tag: string) => `#${tag}`).join(' ')}`,
        access_token: accessToken,
      }),
    });

    if (!mediaResponse.ok) {
      throw new Error(`Instagram media creation failed: ${mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json();

    // Step 2: Publish the media
    const publishResponse = await fetch(`${baseUrl}/me/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: mediaData.id,
        access_token: accessToken,
      }),
    });

    if (!publishResponse.ok) {
      throw new Error(`Instagram publish failed: ${publishResponse.status}`);
    }

    return await publishResponse.json();
  } catch (error) {
    console.error('Instagram publish error:', error);
    throw error;
  }
}

async function publishToFacebook(content: any, accessToken: string, pageId: string) {
  const { baseUrl } = SOCIAL_APIS.facebook;
  
  try {
    const response = await fetch(`${baseUrl}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `${content.caption}\n\n${content.hashtags.map((tag: string) => `#${tag}`).join(' ')}`,
        link: content.media_urls?.[0] || '',
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Facebook publish failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Facebook publish error:', error);
    throw error;
  }
}

async function publishToTwitter(content: any, accessToken: string) {
  // Note: Twitter API v2 requires OAuth 2.0 Bearer Token
  const { baseUrl } = SOCIAL_APIS.twitter;
  
  try {
    const tweetText = `${content.caption}\n\n${content.hashtags.map((tag: string) => `#${tag}`).join(' ')}`;
    
    const response = await fetch(`${baseUrl}/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: tweetText.slice(0, 280), // Twitter character limit
      }),
    });

    if (!response.ok) {
      throw new Error(`Twitter publish failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Twitter publish error:', error);
    throw error;
  }
}

async function publishToLinkedIn(content: any, accessToken: string, personId: string) {
  const { baseUrl } = SOCIAL_APIS.linkedin;
  
  try {
    const response = await fetch(`${baseUrl}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${content.caption}\n\n${content.hashtags.map((tag: string) => `#${tag}`).join(' ')}`,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`LinkedIn publish failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('LinkedIn publish error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { contentId, platform, publishNow = false, scheduledFor }: PublishRequest = await req.json();

    console.log(`Publishing content ${contentId} to ${platform}`);

    // Get the content from database
    const { data: content, error: contentError } = await supabase
      .from('social_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      throw new Error('Content not found');
    }

    // Get social media account credentials
    const { data: account, error: accountError } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('hotel_id', content.hotel_id)
      .eq('platform', platform)
      .eq('is_connected', true)
      .single();

    if (accountError || !account) {
      throw new Error(`${platform} account not connected`);
    }

    let publishResult;
    const accessToken = account.access_token;

    // If not publishing now, just schedule it
    if (!publishNow && scheduledFor) {
      const { error: scheduleError } = await supabase
        .from('social_content')
        .update({
          status: 'scheduled',
          scheduled_for: scheduledFor,
        })
        .eq('id', contentId);

      if (scheduleError) {
        throw scheduleError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Content scheduled successfully',
          scheduledFor: scheduledFor,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Publish to the appropriate platform
    switch (platform) {
      case 'instagram':
        publishResult = await publishToInstagram(content, accessToken);
        break;
      case 'facebook':
        const pageId = account.account_metadata?.pageId || account.account_handle;
        publishResult = await publishToFacebook(content, accessToken, pageId);
        break;
      case 'twitter':
        publishResult = await publishToTwitter(content, accessToken);
        break;
      case 'linkedin':
        const personId = account.account_metadata?.personId || account.account_handle;
        publishResult = await publishToLinkedIn(content, accessToken, personId);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Update content status to published
    const { error: updateError } = await supabase
      .from('social_content')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        performance_data: {
          platform_post_id: publishResult.id || publishResult.post_id,
          published_at: new Date().toISOString(),
        },
      })
      .eq('id', contentId);

    if (updateError) {
      console.error('Error updating content status:', updateError);
    }

    // Log the publication
    console.log(`Successfully published to ${platform}:`, publishResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Content published to ${platform} successfully`,
        platformPostId: publishResult.id || publishResult.post_id,
        publishResult: publishResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in publish-social-content function:', error);
    
    // Update content status to failed if it exists
    try {
      const { contentId } = await req.json();
      if (contentId) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('social_content')
          .update({
            status: 'failed',
            ai_metadata: {
              error: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString(),
            },
          })
          .eq('id', contentId);
      }
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }

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