import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Palette,
  Settings,
  Save,
  Upload,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";

interface AgencyProfile {
  id?: string;
  name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  logo_url?: string;
  branding_config?: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    theme_name: string;
  };
  credit_limit: number;
  current_balance: number;
  payment_terms: number;
  is_active: boolean;
}

const AgencyProfile = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<AgencyProfile>({
    name: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    country: "",
    logo_url: "",
    branding_config: {
      primary_color: "#003580",
      secondary_color: "#009fe3",
      accent_color: "#feba02",
      theme_name: ""
    },
    credit_limit: 0,
    current_balance: 0,
    payment_terms: 30,
    is_active: true
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock agency data - in production, get from session/auth
  const agencyId = "550e8400-e29b-41d4-a716-446655440002";

  const { data: agencyData, isLoading } = useQuery({
    queryKey: ['agency-profile', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', agencyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!agencyId
  });

  useEffect(() => {
    if (agencyData) {
      setProfile({
        ...agencyData,
        branding_config: (typeof agencyData.branding_config === 'object' && agencyData.branding_config) ? 
          agencyData.branding_config as any : {
          primary_color: "#003580",
          secondary_color: "#009fe3", 
          accent_color: "#feba02",
          theme_name: ""
        }
      });
    }
  }, [agencyData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: Partial<AgencyProfile>) => {
      const { data, error } = await supabase
        .from('agencies')
        .update(updatedProfile)
        .eq('id', agencyId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['agency-profile'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordInfo: { currentPassword: string; newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: passwordInfo.newPassword
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Password updated successfully"
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      });
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profile);
  };

  const handleUpdatePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${agencyId}/logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('agency-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('agency-assets')
        .getPublicUrl(fileName);

      setProfile({ ...profile, logo_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agency Profile</h1>
          <p className="text-muted-foreground">Manage your agency information and settings</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2"
          >
            <Save className="h-4 w-4" />
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Agency Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Agency Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency-name">Agency Name</Label>
                  <Input
                    id="agency-name"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    placeholder="Enter agency name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-person">Contact Person</Label>
                  <Input
                    id="contact-person"
                    value={profile.contact_person}
                    onChange={(e) => setProfile({...profile, contact_person: e.target.value})}
                    placeholder="Primary contact name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={profile.contact_email}
                    onChange={(e) => setProfile({...profile, contact_email: e.target.value})}
                    placeholder="contact@agency.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone</Label>
                  <Input
                    id="contact-phone"
                    value={profile.contact_phone}
                    onChange={(e) => setProfile({...profile, contact_phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  placeholder="Street address"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile({...profile, city: e.target.value})}
                    placeholder="City name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => setProfile({...profile, country: e.target.value})}
                    placeholder="Country name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Branding & Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme-name">Theme Name</Label>
                <Input
                  id="theme-name"
                  value={profile.branding_config?.theme_name || ""}
                  onChange={(e) => setProfile({
                    ...profile,
                    branding_config: {
                      ...profile.branding_config!,
                      theme_name: e.target.value
                    }
                  })}
                  placeholder="Custom theme name"
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="primary-color"
                      value={profile.branding_config?.primary_color || "#003580"}
                      onChange={(e) => setProfile({
                        ...profile,
                        branding_config: {
                          ...profile.branding_config!,
                          primary_color: e.target.value
                        }
                      })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={profile.branding_config?.primary_color || "#003580"}
                      onChange={(e) => setProfile({
                        ...profile,
                        branding_config: {
                          ...profile.branding_config!,
                          primary_color: e.target.value
                        }
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="secondary-color"
                      value={profile.branding_config?.secondary_color || "#009fe3"}
                      onChange={(e) => setProfile({
                        ...profile,
                        branding_config: {
                          ...profile.branding_config!,
                          secondary_color: e.target.value
                        }
                      })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={profile.branding_config?.secondary_color || "#009fe3"}
                      onChange={(e) => setProfile({
                        ...profile,
                        branding_config: {
                          ...profile.branding_config!,
                          secondary_color: e.target.value
                        }
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="accent-color"
                      value={profile.branding_config?.accent_color || "#feba02"}
                      onChange={(e) => setProfile({
                        ...profile,
                        branding_config: {
                          ...profile.branding_config!,
                          accent_color: e.target.value
                        }
                      })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={profile.branding_config?.accent_color || "#feba02"}
                      onChange={(e) => setProfile({
                        ...profile,
                        branding_config: {
                          ...profile.branding_config!,
                          accent_color: e.target.value
                        }
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                  />
                </div>
                
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={updatePasswordMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary & Logo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {profile.logo_url ? (
                    <img src={profile.logo_url} alt="Agency Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-md hover:bg-muted">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </div>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </Label>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={profile.is_active ? "default" : "secondary"}>
                    {profile.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Terms</span>
                  <span className="text-sm font-medium">{profile.payment_terms} days</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Credit Limit</span>
                  <span className="text-sm font-medium">
                    ${profile.credit_limit?.toLocaleString() || '0'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Balance</span>
                  <span className="text-sm font-medium">
                    ${profile.current_balance?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">247</div>
                  <div className="text-xs text-muted-foreground">Total Bookings</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">89</div>
                  <div className="text-xs text-muted-foreground">Active Hotels</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgencyProfile;