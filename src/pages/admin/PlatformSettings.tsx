import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Globe, DollarSign, Mail, Shield, Database, Upload, Download } from "lucide-react";
import { auditLogger } from "@/lib/audit-logger";

interface PlatformSettings {
  // Global Settings
  platform_name: string;
  default_currency: string;
  default_timezone: string;
  
  // Tax Settings
  default_tax_rate: number;
  tax_inclusive: boolean;
  city_tax_rate: number;
  
  // Email Settings
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  
  // Security Settings
  session_timeout: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
  };
  
  // Feature Flags
  enable_multi_currency: boolean;
  enable_channel_manager: boolean;
  enable_revenue_ai: boolean;
  enable_guest_portal: boolean;
}

const PlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: 'OtelCiro',
    default_currency: 'USD',
    default_timezone: 'UTC',
    default_tax_rate: 0,
    tax_inclusive: false,
    city_tax_rate: 0,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    session_timeout: 24,
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false,
    },
    enable_multi_currency: true,
    enable_channel_manager: true,
    enable_revenue_ai: true,
    enable_guest_portal: false,
  });

  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const timezones = [
    'UTC', 'EST', 'PST', 'CET', 'GMT', 'JST', 'AEST', 'IST'
  ];

  useEffect(() => {
    fetchSettings();
    fetchCurrencies();
  }, []);

  const fetchSettings = async () => {
    try {
      // In a real app, you'd fetch from a settings table
      // For now, we'll use localStorage as a fallback
      const savedSettings = localStorage.getItem('platform_settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, you'd save to a settings table
      localStorage.setItem('platform_settings', JSON.stringify(settings));

      // Log the settings update
      await auditLogger.log({
        entity_type: 'platform_settings',
        entity_id: 'global',
        action: 'UPDATE',
        new_values: settings,
        metadata: { source: 'admin_panel' }
      });

      toast({
        title: "Settings Saved",
        description: "Platform settings have been updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmailSettings = async () => {
    try {
      // This would test the email configuration
      toast({
        title: "Email Test",
        description: "Test email sent successfully (simulated)",
      });
    } catch (error: any) {
      toast({
        title: "Email Test Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'platform-settings.json';
    link.click();
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings({ ...settings, ...importedSettings });
          toast({
            title: "Settings Imported",
            description: "Settings have been imported successfully",
          });
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Invalid settings file",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure global platform settings and preferences</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={importSettings}
            className="hidden"
          />
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Global Settings
              </CardTitle>
              <CardDescription>Configure basic platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform_name">Platform Name</Label>
                  <Input
                    id="platform_name"
                    value={settings.platform_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, platform_name: e.target.value }))}
                    placeholder="OtelCiro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_timezone">Default Timezone</Label>
                  <Select 
                    value={settings.default_timezone} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, default_timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>Manage currency options and exchange rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Select 
                    value={settings.default_currency} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, default_currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_multi_currency"
                    checked={settings.enable_multi_currency}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_multi_currency: checked }))}
                  />
                  <Label htmlFor="enable_multi_currency">Enable Multi-Currency Support</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tax Configuration
              </CardTitle>
              <CardDescription>Set up default tax rates and policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
                  <Input
                    id="default_tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.default_tax_rate}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_tax_rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="10.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city_tax_rate">City Tax Rate (%)</Label>
                  <Input
                    id="city_tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.city_tax_rate}
                    onChange={(e) => setSettings(prev => ({ ...prev, city_tax_rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="2.50"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="tax_inclusive"
                  checked={settings.tax_inclusive}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, tax_inclusive: checked }))}
                />
                <Label htmlFor="tax_inclusive">Tax Inclusive Pricing</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>Configure SMTP settings for outgoing emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                    placeholder="587"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_user">SMTP Username</Label>
                  <Input
                    id="smtp_user"
                    value={settings.smtp_user}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_user: e.target.value }))}
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_password">SMTP Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="from_email">From Email Address</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={settings.from_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder="noreply@otelciro.com"
                  />
                </div>
              </div>

              <Button onClick={testEmailSettings} variant="outline">
                Test Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security policies and session management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout (hours)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.session_timeout}
                  onChange={(e) => setSettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) || 24 }))}
                  placeholder="24"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Password Policy</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="min_length">Minimum Length</Label>
                  <Input
                    id="min_length"
                    type="number"
                    min="6"
                    max="32"
                    value={settings.password_policy.min_length}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      password_policy: {
                        ...prev.password_policy,
                        min_length: parseInt(e.target.value) || 8
                      }
                    }))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require_uppercase"
                      checked={settings.password_policy.require_uppercase}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        password_policy: { ...prev.password_policy, require_uppercase: checked }
                      }))}
                    />
                    <Label htmlFor="require_uppercase">Require Uppercase Letters</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require_lowercase"
                      checked={settings.password_policy.require_lowercase}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        password_policy: { ...prev.password_policy, require_lowercase: checked }
                      }))}
                    />
                    <Label htmlFor="require_lowercase">Require Lowercase Letters</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require_numbers"
                      checked={settings.password_policy.require_numbers}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        password_policy: { ...prev.password_policy, require_numbers: checked }
                      }))}
                    />
                    <Label htmlFor="require_numbers">Require Numbers</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require_symbols"
                      checked={settings.password_policy.require_symbols}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        password_policy: { ...prev.password_policy, require_symbols: checked }
                      }))}
                    />
                    <Label htmlFor="require_symbols">Require Special Characters</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_channel_manager" className="text-base font-medium">Channel Manager</Label>
                    <p className="text-sm text-muted-foreground">Connect with OTAs and distribution channels</p>
                  </div>
                  <Switch
                    id="enable_channel_manager"
                    checked={settings.enable_channel_manager}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_channel_manager: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_revenue_ai" className="text-base font-medium">Revenue AI</Label>
                    <p className="text-sm text-muted-foreground">AI-powered revenue management and pricing</p>
                  </div>
                  <Switch
                    id="enable_revenue_ai"
                    checked={settings.enable_revenue_ai}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_revenue_ai: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_guest_portal" className="text-base font-medium">Guest Portal</Label>
                    <p className="text-sm text-muted-foreground">Self-service portal for guests</p>
                  </div>
                  <Switch
                    id="enable_guest_portal"
                    checked={settings.enable_guest_portal}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_guest_portal: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformSettings;