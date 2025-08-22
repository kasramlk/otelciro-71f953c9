import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Star, 
  Copy, 
  Edit, 
  Trash2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Image as ImageIcon,
  Video,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface ContentTemplate {
  id: string;
  name: string;
  category: 'promotion' | 'event' | 'amenity' | 'guest_experience' | 'seasonal' | 'general';
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'universal';
  contentType: 'post' | 'story' | 'reel' | 'carousel';
  preview: string;
  usageCount: number;
  isFavorite: boolean;
}

const mockTemplates: ContentTemplate[] = [
  {
    id: '1',
    name: 'Spa Weekend Promotion',
    category: 'promotion',
    platform: 'instagram',
    contentType: 'post',
    preview: 'Escape the ordinary with our luxurious spa weekend package... 🧘‍♀️✨',
    usageCount: 24,
    isFavorite: true
  },
  {
    id: '2',
    name: 'Welcome Guest Experience',
    category: 'guest_experience',
    platform: 'universal',
    contentType: 'post',
    preview: 'Welcome to [Hotel Name]! We\'re thrilled to have you stay with us...',
    usageCount: 156,
    isFavorite: false
  },
  {
    id: '3',
    name: 'Holiday Event Announcement',
    category: 'event',
    platform: 'facebook',
    contentType: 'post',
    preview: 'Join us for an unforgettable holiday celebration at [Hotel Name]...',
    usageCount: 8,
    isFavorite: true
  },
  {
    id: '4',
    name: 'Restaurant Feature',
    category: 'amenity',
    platform: 'instagram',
    contentType: 'reel',
    preview: 'Experience culinary excellence at our award-winning restaurant...',
    usageCount: 67,
    isFavorite: false
  },
  {
    id: '5',
    name: 'Summer Season Launch',
    category: 'seasonal',
    platform: 'twitter',
    contentType: 'post',
    preview: 'Summer has arrived at [Hotel Name]! ☀️ Dive into luxury with our...',
    usageCount: 12,
    isFavorite: false
  },
  {
    id: '6',
    name: 'Business Travel Package',
    category: 'promotion',
    platform: 'linkedin',
    contentType: 'post',
    preview: 'Elevate your business travel experience with our executive package...',
    usageCount: 34,
    isFavorite: true
  }
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'promotion', label: 'Promotions' },
  { value: 'event', label: 'Events' },
  { value: 'amenity', label: 'Amenities' },
  { value: 'guest_experience', label: 'Guest Experience' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'general', label: 'General' }
];

const PLATFORMS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-blue-400' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { value: 'universal', label: 'Universal', icon: ImageIcon, color: 'text-gray-600' }
];

export const ContentTemplates: React.FC = () => {
  const [templates] = useState<ContentTemplate[]>(mockTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesPlatform = selectedPlatform === 'all' || template.platform === selectedPlatform;
    
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  const getPlatformIcon = (platform: string) => {
    const platformData = PLATFORMS.find(p => p.value === platform);
    if (!platformData?.icon) return ImageIcon;
    return platformData.icon;
  };

  const getPlatformColor = (platform: string) => {
    const platformData = PLATFORMS.find(p => p.value === platform);
    return platformData?.color || 'text-gray-600';
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'reel':
      case 'video':
        return Video;
      default:
        return ImageIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      promotion: 'bg-red-50 text-red-700 border-red-200',
      event: 'bg-purple-50 text-purple-700 border-purple-200',
      amenity: 'bg-blue-50 text-blue-700 border-blue-200',
      guest_experience: 'bg-green-50 text-green-700 border-green-200',
      seasonal: 'bg-orange-50 text-orange-700 border-orange-200',
      general: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Templates</h1>
          <p className="text-muted-foreground">
            Pre-designed templates using your brand guidelines and proven messaging
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              {CATEGORIES.map(category => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="whitespace-nowrap"
                >
                  {category.label}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              {PLATFORMS.map(platform => (
                <Button
                  key={platform.value}
                  variant={selectedPlatform === platform.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform.value)}
                  className="whitespace-nowrap"
                >
                  {platform.icon && <platform.icon className={`h-4 w-4 mr-1 ${platform.color}`} />}
                  {platform.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => {
          const PlatformIcon = getPlatformIcon(template.platform);
          const ContentIcon = getContentTypeIcon(template.contentType);
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <PlatformIcon className={`h-4 w-4 ${getPlatformColor(template.platform)}`} />
                      <ContentIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {template.name}
                        </CardTitle>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {template.isFavorite && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Use Template
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Star className="h-4 w-4 mr-2" />
                            {template.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCategoryColor(template.category)}`}
                    >
                      {template.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {template.contentType}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {template.preview}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Used {template.usageCount} times</span>
                    <Button variant="outline" size="sm">
                      <Copy className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No templates found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};