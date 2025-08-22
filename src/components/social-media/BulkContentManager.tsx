import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  Download, 
  Calendar, 
  Zap, 
  CheckCircle, 
  XCircle,
  Clock,
  Send,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkContentItem {
  id: string;
  prompt: string;
  platform: string[];
  tone: string;
  language: string;
  status: 'waiting' | 'generating' | 'completed' | 'failed';
  generatedContent?: {
    caption: string;
    hashtags: string[];
  };
  error?: string;
}

const BATCH_PROMPTS = [
  "Create a post about our spa services being perfect for winter relaxation",
  "Highlight our restaurant's new seasonal menu items",
  "Show off our hotel's stunning lobby and welcome area",
  "Promote our business center facilities for corporate travelers",
  "Feature our rooftop terrace with city views",
  "Announce our weekend special offers for couples",
  "Showcase our fitness center and wellness amenities",
  "Highlight our concierge services and local recommendations"
];

export const BulkContentManager: React.FC = () => {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<BulkContentItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [customPrompts, setCustomPrompts] = useState('');

  const handleAddPrompts = () => {
    const prompts = customPrompts.split('\n').filter(p => p.trim());
    if (prompts.length === 0) {
      toast({
        title: "No Prompts",
        description: "Please enter at least one content prompt",
        variant: "destructive"
      });
      return;
    }

    const newItems: BulkContentItem[] = prompts.map((prompt, index) => ({
      id: `item-${Date.now()}-${index}`,
      prompt: prompt.trim(),
      platform: [...selectedPlatforms],
      tone: selectedTone,
      language: selectedLanguage,
      status: 'waiting'
    }));

    setContentItems(prev => [...prev, ...newItems]);
    setCustomPrompts('');
    
    toast({
      title: "Prompts Added",
      description: `Added ${prompts.length} content prompts to the queue`,
    });
  };

  const handleUseSamplePrompts = () => {
    const newItems: BulkContentItem[] = BATCH_PROMPTS.map((prompt, index) => ({
      id: `sample-${Date.now()}-${index}`,
      prompt,
      platform: [...selectedPlatforms],
      tone: selectedTone,
      language: selectedLanguage,
      status: 'waiting'
    }));

    setContentItems(prev => [...prev, ...newItems]);
    
    toast({
      title: "Sample Prompts Added",
      description: `Added ${BATCH_PROMPTS.length} sample prompts to the queue`,
    });
  };

  const generateContent = async (item: BulkContentItem) => {
    try {
      setContentItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'generating' }
            : i
        )
      );

      // Simulate API call to generate content
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // In a real implementation, this would call the generate-social-content function
      const mockContent = {
        caption: `AI-generated content for: ${item.prompt.slice(0, 50)}...`,
        hashtags: ['hotel', 'luxury', 'travel', 'hospitality', 'experience']
      };

      setContentItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { 
                ...i, 
                status: 'completed',
                generatedContent: mockContent
              }
            : i
        )
      );
    } catch (error) {
      setContentItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { 
                ...i, 
                status: 'failed',
                error: error instanceof Error ? error.message : 'Generation failed'
              }
            : i
        )
      );
    }
  };

  const handleGenerateAll = async () => {
    const waitingItems = contentItems.filter(item => item.status === 'waiting');
    
    if (waitingItems.length === 0) {
      toast({
        title: "No Content to Generate",
        description: "Add some prompts first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Generate content for all items in parallel (with some delay to avoid rate limits)
    const promises = waitingItems.map((item, index) => 
      new Promise(resolve => 
        setTimeout(() => {
          generateContent(item).finally(resolve);
        }, index * 1000) // Stagger requests by 1 second
      )
    );

    await Promise.all(promises);
    setIsGenerating(false);
    
    toast({
      title: "Bulk Generation Complete",
      description: `Generated content for ${waitingItems.length} prompts`,
    });
  };

  const handleScheduleAll = () => {
    const completedItems = contentItems.filter(item => item.status === 'completed');
    
    if (completedItems.length === 0) {
      toast({
        title: "No Content to Schedule",
        description: "Generate some content first",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would open a scheduling modal
    toast({
      title: "Scheduling Content",
      description: `Scheduling ${completedItems.length} pieces of content`,
    });
  };

  const handleRemoveItem = (id: string) => {
    setContentItems(prev => prev.filter(item => item.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-gray-100 text-gray-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedCount = contentItems.filter(item => item.status === 'completed').length;
  const failedCount = contentItems.filter(item => item.status === 'failed').length;
  const generatingCount = contentItems.filter(item => item.status === 'generating').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Content Manager</h1>
        <p className="text-muted-foreground">
          Generate multiple pieces of content simultaneously and manage them efficiently
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bulk Setup
            </CardTitle>
            <CardDescription>
              Configure settings for bulk content generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Platforms</Label>
              <div className="space-y-2">
                {['instagram', 'facebook', 'twitter', 'linkedin'].map(platform => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform}
                      checked={selectedPlatforms.includes(platform)}
                       onCheckedChange={(checked) => {
                         if (checked) {
                           setSelectedPlatforms(prev => [...prev, platform]);
                         } else {
                           setSelectedPlatforms(prev => prev.filter(p => p !== platform));
                         }
                       }}
                    />
                    <Label htmlFor={platform} className="capitalize text-sm">
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Brand Tone</Label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="trendy">Trendy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Add Content Prompts</Label>
              <Textarea
                placeholder="Enter each prompt on a new line&#10;Example:&#10;Create a post about our spa services&#10;Highlight our restaurant's menu&#10;Show our hotel lobby"
                value={customPrompts}
                onChange={(e) => setCustomPrompts(e.target.value)}
                className="min-h-[100px] mb-3"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddPrompts} size="sm" className="flex-1">
                  <Upload className="h-3 w-3 mr-1" />
                  Add Prompts
                </Button>
                <Button onClick={handleUseSamplePrompts} variant="outline" size="sm">
                  <FileText className="h-3 w-3 mr-1" />
                  Use Samples
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Content Queue ({contentItems.length})
                  </CardTitle>
                  <CardDescription>
                    {completedCount} completed • {generatingCount} generating • {failedCount} failed
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerateAll} 
                    disabled={isGenerating || contentItems.filter(i => i.status === 'waiting').length === 0}
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate All
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleScheduleAll} 
                    variant="outline" 
                    size="sm"
                    disabled={completedCount === 0}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {contentItems.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Content in Queue</h3>
                  <p className="text-sm text-muted-foreground">
                    Add some prompts to get started with bulk content generation
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <AnimatePresence>
                    {contentItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(item.status)}
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                              <div className="flex gap-1">
                                {item.platform.map(platform => (
                                  <Badge key={platform} variant="outline" className="text-xs">
                                    {platform}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <p className="text-sm mb-2 line-clamp-2">{item.prompt}</p>
                            
                            {item.generatedContent && (
                              <div className="bg-muted/50 rounded p-2 text-xs">
                                <p className="font-medium mb-1">Generated:</p>
                                <p className="line-clamp-2 text-muted-foreground">
                                  {item.generatedContent.caption}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.generatedContent.hashtags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-primary">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {item.error && (
                              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                                Error: {item.error}
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};