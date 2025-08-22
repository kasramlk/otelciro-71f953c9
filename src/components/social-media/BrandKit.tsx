import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Upload, 
  Download, 
  Eye, 
  Plus,
  Save,
  Trash2,
  Copy,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    <div className="flex items-center gap-3">
      <div 
        className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer"
        style={{ backgroundColor: value }}
        onClick={() => {
          // In a real app, this would open a color picker modal
          const newColor = prompt("Enter hex color:", value);
          if (newColor) onChange(newColor);
        }}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1"
      />
    </div>
  </div>
);

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({ label, value, onChange }) => {
  const fonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Playfair Display'];
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-border rounded-md bg-background"
      >
        {fonts.map(font => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>
    </div>
  );
};

export const BrandKit: React.FC = () => {
  const [brandData, setBrandData] = useState({
    name: 'Hotel Brand Kit',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#dc2626',
    fontPrimary: 'Inter',
    fontSecondary: 'Roboto',
    logoUrl: '',
    brandVoice: {
      tone: 'professional',
      style: 'modern',
      personality: ['friendly', 'trustworthy', 'luxury']
    }
  });

  const handleSave = () => {
    // TODO: Save to Supabase
    console.log('Saving brand kit:', brandData);
  };

  const brandPersonalities = [
    'Friendly', 'Professional', 'Luxury', 'Modern', 'Traditional', 
    'Trustworthy', 'Innovative', 'Warm', 'Sophisticated', 'Approachable'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Kit</h1>
          <p className="text-muted-foreground">
            Define your hotel's visual identity and brand voice for consistent social media content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">Colors & Fonts</TabsTrigger>
          <TabsTrigger value="logo">Logo & Assets</TabsTrigger>
          <TabsTrigger value="voice">Brand Voice</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Palette
                </CardTitle>
                <CardDescription>
                  Define your brand colors for consistent visual identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  value={brandData.primaryColor}
                  onChange={(color) => setBrandData(prev => ({ ...prev, primaryColor: color }))}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={brandData.secondaryColor}
                  onChange={(color) => setBrandData(prev => ({ ...prev, secondaryColor: color }))}
                />
                <ColorPicker
                  label="Accent Color"
                  value={brandData.accentColor}
                  onChange={(color) => setBrandData(prev => ({ ...prev, accentColor: color }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Typography
                </CardTitle>
                <CardDescription>
                  Choose fonts that reflect your brand personality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FontSelector
                  label="Primary Font"
                  value={brandData.fontPrimary}
                  onChange={(font) => setBrandData(prev => ({ ...prev, fontPrimary: font }))}
                />
                <FontSelector
                  label="Secondary Font"
                  value={brandData.fontSecondary}
                  onChange={(font) => setBrandData(prev => ({ ...prev, fontSecondary: font }))}
                />
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Preview</h4>
                  <div style={{ fontFamily: brandData.fontPrimary, color: brandData.primaryColor }}>
                    <h3 className="text-lg font-bold">Your Hotel Name</h3>
                  </div>
                  <div style={{ fontFamily: brandData.fontSecondary, color: brandData.secondaryColor }}>
                    <p className="text-sm">Experience luxury and comfort at its finest</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="logo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logo & Visual Assets
              </CardTitle>
              <CardDescription>
                Upload your hotel logo and other brand assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Primary Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload logo</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG (max 2MB)</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label>Logo Variations</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-border rounded-lg p-4 text-center bg-muted/50">
                      <Plus className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs">White Version</p>
                    </div>
                    <div className="border border-border rounded-lg p-4 text-center bg-muted/50">
                      <Plus className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs">Icon Only</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice & Personality</CardTitle>
              <CardDescription>
                Define how your hotel communicates on social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Communication Tone</Label>
                    <select 
                      value={brandData.brandVoice.tone}
                      onChange={(e) => setBrandData(prev => ({
                        ...prev,
                        brandVoice: { ...prev.brandVoice, tone: e.target.value }
                      }))}
                      className="w-full mt-2 p-2 border border-border rounded-md bg-background"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="luxury">Luxury</option>
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Communication Style</Label>
                    <select 
                      value={brandData.brandVoice.style}
                      onChange={(e) => setBrandData(prev => ({
                        ...prev,
                        brandVoice: { ...prev.brandVoice, style: e.target.value }
                      }))}
                      className="w-full mt-2 p-2 border border-border rounded-md bg-background"
                    >
                      <option value="modern">Modern</option>
                      <option value="traditional">Traditional</option>
                      <option value="contemporary">Contemporary</option>
                      <option value="classic">Classic</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Brand Personality</Label>
                  <div className="flex flex-wrap gap-2">
                    {brandPersonalities.map(personality => (
                      <Badge 
                        key={personality}
                        variant={brandData.brandVoice.personality.includes(personality.toLowerCase()) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = brandData.brandVoice.personality;
                          const personality_lower = personality.toLowerCase();
                          const updated = current.includes(personality_lower)
                            ? current.filter(p => p !== personality_lower)
                            : [...current, personality_lower];
                          setBrandData(prev => ({
                            ...prev,
                            brandVoice: { ...prev.brandVoice, personality: updated }
                          }));
                        }}
                      >
                        {personality}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Voice Preview</h4>
                <p className="text-sm text-muted-foreground">
                  Based on your settings, your brand voice is: <strong>{brandData.brandVoice.tone}</strong> and <strong>{brandData.brandVoice.style}</strong>, 
                  with a personality that's <strong>{brandData.brandVoice.personality.join(', ')}</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Templates</CardTitle>
              <CardDescription>
                Pre-designed templates using your brand guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-3 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium text-sm">Template {i}</h4>
                    <p className="text-xs text-muted-foreground">Social media post template</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};