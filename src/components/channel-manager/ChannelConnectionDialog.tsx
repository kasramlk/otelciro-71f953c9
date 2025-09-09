import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Zap, TrendingUp, Settings } from "lucide-react";

interface ChannelConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string | null;
  onSuccess: () => void;
}

interface ChannelForm {
  channel_name: string;
  channel_type: string;
  endpoint_url: string;
  api_credentials: {
    token?: string;
    username?: string;
    password?: string;
    api_key?: string;
    headers?: Record<string, string>;
  };
  rate_push_enabled: boolean;
  availability_push_enabled: boolean;
  receive_reservations: boolean;
  sync_frequency: number;
  channel_settings: Record<string, any>;
}

const CHANNEL_TYPES = [
  { value: 'beds24', label: 'Beds24', icon: Activity, description: 'Connect to Beds24 Channel Manager' },
  { value: 'gds', label: 'GDS', icon: Zap, description: 'Global Distribution System' },
  { value: 'ota', label: 'OTA', icon: TrendingUp, description: 'Online Travel Agency' },
  { value: 'direct', label: 'Direct API', icon: Settings, description: 'Custom API Integration' }
];

export function ChannelConnectionDialog({ 
  open, 
  onOpenChange, 
  hotelId, 
  onSuccess 
}: ChannelConnectionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ChannelForm>({
    channel_name: '',
    channel_type: '',
    endpoint_url: '',
    api_credentials: {},
    rate_push_enabled: true,
    availability_push_enabled: true,
    receive_reservations: true,
    sync_frequency: 300,
    channel_settings: {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('channel_connections')
        .insert({
          hotel_id: hotelId,
          ...form
        });

      if (error) throw error;

      toast({
        title: "Channel Connected",
        description: `${form.channel_name} has been successfully connected`
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setForm({
        channel_name: '',
        channel_type: '',
        endpoint_url: '',
        api_credentials: {},
        rate_push_enabled: true,
        availability_push_enabled: true,
        receive_reservations: true,
        sync_frequency: 300,
        channel_settings: {}
      });

    } catch (error) {
      console.error('Error creating channel connection:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to create channel connection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCredentials = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      api_credentials: {
        ...prev.api_credentials,
        [key]: value
      }
    }));
  };

  const selectedChannelType = CHANNEL_TYPES.find(type => type.value === form.channel_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Channel Connection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Channel Type Selection */}
          <div className="space-y-4">
            <Label>Channel Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {CHANNEL_TYPES.map((type) => (
                <Card 
                  key={type.value}
                  className={`cursor-pointer transition-colors ${
                    form.channel_type === type.value 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setForm(prev => ({ ...prev, channel_type: type.value }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <type.icon className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium text-foreground">{type.label}</h3>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel_name">Channel Name</Label>
              <Input
                id="channel_name"
                value={form.channel_name}
                onChange={(e) => setForm(prev => ({ ...prev, channel_name: e.target.value }))}
                placeholder="My Channel Connection"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint_url">API Endpoint URL</Label>
              <Input
                id="endpoint_url"
                type="url"
                value={form.endpoint_url}
                onChange={(e) => setForm(prev => ({ ...prev, endpoint_url: e.target.value }))}
                placeholder="https://api.channel.com/v1"
                required
              />
            </div>
          </div>

          {/* API Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.channel_type === 'beds24' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Token</Label>
                    <Input
                      type="password"
                      value={form.api_credentials.token || ''}
                      onChange={(e) => updateCredentials('token', e.target.value)}
                      placeholder="Your Beds24 API token"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Property ID</Label>
                    <Input
                      value={(form.api_credentials as any).property_id || ''}
                      onChange={(e) => updateCredentials('property_id', e.target.value)}
                      placeholder="Beds24 Property ID"
                    />
                  </div>
                </div>
              )}

              {form.channel_type === 'gds' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={form.api_credentials.username || ''}
                      onChange={(e) => updateCredentials('username', e.target.value)}
                      placeholder="GDS Username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={form.api_credentials.password || ''}
                      onChange={(e) => updateCredentials('password', e.target.value)}
                      placeholder="GDS Password"
                    />
                  </div>
                </div>
              )}

              {(form.channel_type === 'ota' || form.channel_type === 'direct') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={form.api_credentials.api_key || ''}
                      onChange={(e) => updateCredentials('api_key', e.target.value)}
                      placeholder="Your API Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Headers (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(form.api_credentials.headers || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const headers = JSON.parse(e.target.value);
                          updateCredentials('headers', headers);
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Channel Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Channel Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rate Push Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically push rate changes to this channel
                  </p>
                </div>
                <Switch
                  checked={form.rate_push_enabled}
                  onCheckedChange={(checked) => 
                    setForm(prev => ({ ...prev, rate_push_enabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Availability Push Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically push availability changes to this channel
                  </p>
                </div>
                <Switch
                  checked={form.availability_push_enabled}
                  onCheckedChange={(checked) => 
                    setForm(prev => ({ ...prev, availability_push_enabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Receive Reservations</Label>
                  <p className="text-sm text-muted-foreground">
                    Accept incoming reservations from this channel
                  </p>
                </div>
                <Switch
                  checked={form.receive_reservations}
                  onCheckedChange={(checked) => 
                    setForm(prev => ({ ...prev, receive_reservations: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync_frequency">Sync Frequency (seconds)</Label>
                <Select
                  value={form.sync_frequency.toString()}
                  onValueChange={(value) => 
                    setForm(prev => ({ ...prev, sync_frequency: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.channel_name || !form.channel_type}>
              {loading ? "Connecting..." : "Connect Channel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}