import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Sparkles, 
  Copy, 
  Save, 
  RefreshCw, 
  Send,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Globe,
  TrendingUp,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSocialMediaStore } from '@/stores/social-media-store';

interface GeneratedContent {
  id: string;
  caption: string;
  hashtags: string[];
  platform: string;
  contentType: string;
  language: string;
  generatedAt: string;
}

const TONES = [
  { value: 'luxury', label: 'Luxury', description: 'Elegant and sophisticated' },
  { value: 'boutique', label: 'Boutique', description: 'Personal and intimate' },
  { value: 'family', label: 'Family', description: 'Warm and welcoming' },
  { value: 'budget', label: 'Budget', description: 'Value-focused and practical' },
  { value: 'trendy', label: 'Trendy', description: 'Modern and energetic' },
  { value: 'professional', label: 'Professional', description: 'Polished and trustworthy' }
];

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-blue-400' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' }
];

const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' }
];

const CONTENT_TYPES = [
  { value: 'post', label: 'Regular Post' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel/Video' },
  { value: 'carousel', label: 'Carousel' }
];

export const AIContentGenerator: React.FC = () => {
  const { toast } = useToast();
  const { createContent } = useSocialMediaStore();
  
  const [formData, setFormData] = useState({
    prompt: '',
    tone: 'professional',
    platform: 'instagram',
    contentType: 'post',
    language: 'en',
    includeHashtags: true,
    usePMSData: false
  });
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pmsContext, setPmsContext] = useState({
    occupancyRate: '',
    currentPromotions: '',
    upcomingEvents: '',
    seasonalContext: ''
  });

  const handleGenerate = async () => {
    if (!formData.prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter a content prompt",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: {
          hotelId: '550e8400-e29b-41d4-a716-446655440000', // TODO: Get from auth context
          prompt: formData.prompt,
          tone: formData.tone,
          platform: formData.platform,
          contentType: formData.contentType,
          language: formData.language,
          includeHashtags: formData.includeHashtags,
          pmsData: formData.usePMSData ? pmsContext : {}
        }
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedContent(data.content);
        toast({
          title: "Content Generated!",
          description: "Your AI-powered social media content is ready",
        });
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyContent = () => {
    if (!generatedContent) return;
    
    const fullContent = `${generatedContent.caption}\n\n${generatedContent.hashtags.map(tag => `#${tag}`).join(' ')}`;
    navigator.clipboard.writeText(fullContent);
    
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const handleSaveContent = async () => {
    if (!generatedContent) return;
    
    try {
      // Content is already saved in the database, just show confirmation
      toast({
        title: "Content Saved!",
        description: "Content has been saved to your drafts",
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save content",
        variant: "destructive"
      });
    }
  };

  const selectedPlatform = PLATFORMS.find(p => p.value === formData.platform);
  const selectedTone = TONES.find(t => t.value === formData.tone);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Content Generator</h1>
        <p className="text-muted-foreground">
          Create engaging social media content powered by AI and your hotel's data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Content Settings
            </CardTitle>
            <CardDescription>
              Configure your AI-generated content preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Content Prompt *</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., 'Create a post about our spa services being perfect for winter relaxation'"
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select 
                  value={formData.platform} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(platform => (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center gap-2">
                          <platform.icon className={`h-4 w-4 ${platform.color}`} />
                          {platform.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select 
                  value={formData.contentType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Brand Tone</Label>
              <Select 
                value={formData.tone} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map(tone => (
                    <SelectItem key={tone.value} value={tone.value}>
                      <div>
                        <div className="font-medium">{tone.label}</div>
                        <div className="text-xs text-muted-foreground">{tone.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select 
                value={formData.language} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span>{lang.flag} {lang.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Include Hashtags</Label>
                <p className="text-xs text-muted-foreground">Add relevant hashtags to your content</p>
              </div>
              <Switch 
                checked={formData.includeHashtags}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeHashtags: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Use PMS Data</Label>
                <p className="text-xs text-muted-foreground">Include hotel occupancy and events data</p>
              </div>
              <Switch 
                checked={formData.usePMSData}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, usePMSData: checked }))}
              />
            </div>

            {formData.usePMSData && (
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium mb-3">PMS Context</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Occupancy Rate</Label>
                    <Input 
                      placeholder="85%" 
                      value={pmsContext.occupancyRate}
                      onChange={(e) => setPmsContext(prev => ({ ...prev, occupancyRate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Current Promotions</Label>
                    <Input 
                      placeholder="20% off spa" 
                      value={pmsContext.currentPromotions}
                      onChange={(e) => setPmsContext(prev => ({ ...prev, currentPromotions: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Upcoming Events</Label>
                    <Input 
                      placeholder="Wine tasting Friday" 
                      value={pmsContext.upcomingEvents}
                      onChange={(e) => setPmsContext(prev => ({ ...prev, upcomingEvents: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Seasonal Context</Label>
                    <Input 
                      placeholder="Winter season" 
                      value={pmsContext.seasonalContext}
                      onChange={(e) => setPmsContext(prev => ({ ...prev, seasonalContext: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>
            )}

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !formData.prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Generated Content
            </CardTitle>
            <CardDescription>
              Your AI-generated social media content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {!generatedContent ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">Ready to Generate</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fill in your content prompt and settings, then click generate
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline">{selectedPlatform?.label}</Badge>
                    <Badge variant="outline">{selectedTone?.label}</Badge>
                    <Badge variant="outline">{LANGUAGES.find(l => l.value === formData.language)?.label}</Badge>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedPlatform && <selectedPlatform.icon className={`h-4 w-4 ${selectedPlatform.color}`} />}
                      <span className="font-medium">{selectedPlatform?.label}</span>
                      <Badge variant="secondary">{formData.contentType}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyContent}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleSaveContent}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{generatedContent.caption}</p>
                    </div>
                  </div>

                  {generatedContent.hashtags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Hashtags</Label>
                      <div className="flex flex-wrap gap-1">
                        {generatedContent.hashtags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Generated {new Date(generatedContent.generatedAt).toLocaleString()}
                      </span>
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-1" />
                        Schedule Post
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};