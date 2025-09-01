import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Settings, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Globe,
  Building2,
  Plane
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChannelConnectionProps {
  onChannelConnected: () => void;
}

interface ChannelTemplate {
  id: string;
  name: string;
  type: string;
  icon: any;
  description: string;
  requiresCredentials: boolean;
  credentialFields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
  }>;
}

const channelTemplates: ChannelTemplate[] = [
  {
    id: 'booking-com',
    name: 'Booking.com',
    type: 'OTA',
    icon: Globe,
    description: 'Connect to Booking.com for reservations and inventory management',
    requiresCredentials: true,
    credentialFields: [
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'hotel_id', label: 'Hotel ID', type: 'text', required: true, placeholder: 'Your Booking.com property ID' }
    ]
  },
  {
    id: 'expedia',
    name: 'Expedia',
    type: 'OTA',
    icon: Plane,
    description: 'Connect to Expedia Group for broader market reach',
    requiresCredentials: true,
    credentialFields: [
      { key: 'eqc_username', label: 'EQC Username', type: 'text', required: true },
      { key: 'eqc_password', label: 'EQC Password', type: 'password', required: true },
      { key: 'property_id', label: 'Property ID', type: 'text', required: true }
    ]
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    type: 'OTA',
    icon: Building2,
    description: 'Connect to Airbnb for vacation rental management',
    requiresCredentials: true,
    credentialFields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'listing_id', label: 'Listing ID', type: 'text', required: true }
    ]
  }
];

export const ChannelConnection: React.FC<ChannelConnectionProps> = ({ onChannelConnected }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelTemplate | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState({
    sync_enabled: true,
    sync_frequency: 3600,
    auto_accept_reservations: false
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!selectedChannel) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('channels')
        .insert({
          channel_name: selectedChannel.name,
          channel_type: selectedChannel.type,
          api_endpoint: `https://api.${selectedChannel.id}.com`,
          api_credentials: credentials,
          sync_enabled: settings.sync_enabled,
          sync_frequency: settings.sync_frequency,
          settings: {
            auto_accept_reservations: settings.auto_accept_reservations,
            template_id: selectedChannel.id
          },
          hotel_id: (await supabase.auth.getUser()).data.user?.id // This would need proper hotel selection
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully connected to ${selectedChannel.name}`
      });

      setIsDialogOpen(false);
      setSelectedChannel(null);
      setCredentials({});
      onChannelConnected();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect channel",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCredential = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Channel Connections</h2>
          <p className="text-muted-foreground">
            Connect to distribution channels to manage your inventory and reservations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Connect Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Connect New Channel</DialogTitle>
              <DialogDescription>
                Select a channel and provide the required credentials to establish connection
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Channel Selection */}
              <div className="grid grid-cols-1 gap-4">
                <Label>Select Channel</Label>
                <div className="grid grid-cols-1 gap-3">
                  {channelTemplates.map((template) => {
                    const IconComponent = template.icon;
                    return (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-colors ${
                          selectedChannel?.id === template.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedChannel(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <IconComponent className="h-8 w-8 text-primary" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{template.name}</h3>
                                <Badge variant="secondary">{template.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                            </div>
                            {selectedChannel?.id === template.id && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Credentials Form */}
              {selectedChannel && selectedChannel.requiresCredentials && (
                <div className="space-y-4">
                  <Label>API Credentials</Label>
                  <div className="space-y-3">
                    {selectedChannel.credentialFields.map((field) => (
                      <div key={field.key}>
                        <Label htmlFor={field.key}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id={field.key}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={credentials[field.key] || ''}
                          onChange={(e) => updateCredential(field.key, e.target.value)}
                          required={field.required}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              {selectedChannel && (
                <div className="space-y-4">
                  <Label>Sync Settings</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync_enabled">Enable Auto Sync</Label>
                      <Switch
                        id="sync_enabled"
                        checked={settings.sync_enabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, sync_enabled: checked }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="sync_frequency">Sync Frequency (seconds)</Label>
                      <Input
                        id="sync_frequency"
                        type="number"
                        value={settings.sync_frequency}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, sync_frequency: parseInt(e.target.value) }))
                        }
                        min={300}
                        max={86400}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto_accept">Auto Accept Reservations</Label>
                      <Switch
                        id="auto_accept"
                        checked={settings.auto_accept_reservations}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, auto_accept_reservations: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConnect} 
                  disabled={!selectedChannel || loading}
                >
                  {loading ? 'Connecting...' : 'Connect Channel'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <span>Getting Started</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Before connecting:</strong> Make sure you have active accounts with the channels 
              you want to connect to and have access to their API credentials.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Booking.com: Requires Extranet access and API credentials</li>
              <li>Expedia: Needs EQC (Expedia Quick Connect) account setup</li>
              <li>Airbnb: Requires API key from Airbnb for Business</li>
            </ul>
            <p className="text-muted-foreground">
              Need help? Contact your channel manager or check the documentation for credential setup guides.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};