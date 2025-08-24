import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLogger } from "@/lib/audit-logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Shield,
  Save,
  Plus,
  X,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface GuestProfileManagerProps {
  guestId?: string;
  reservationData?: {
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    nationality?: string;
    idNumber?: string;
  };
  onProfileCreated?: (profileId: string) => void;
  onProfileUpdated?: (profileId: string) => void;
}

export const GuestProfileManager = ({
  guestId,
  reservationData,
  onProfileCreated,
  onProfileUpdated,
}: GuestProfileManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logReservationCreated, logGuestCreated } = useAuditLogger();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    nationality: "",
    id_number: "",
    dob: "",
    address: "",
    city: "",
    country: "",
    preferences: [] as string[],
    vip_status: false,
    blacklist_flag: false,
    blacklist_reason: "",
    loyalty_tier: "Standard",
    loyalty_points: 0,
    marketing_consent: false,
    communication_preferences: {
      email: true,
      sms: false,
      phone: false,
      whatsapp: false
    }
  });

  // Auto-create guest profile from reservation data
  useEffect(() => {
    if (reservationData && !guestId) {
      setFormData(prev => ({
        ...prev,
        first_name: reservationData.firstName,
        last_name: reservationData.lastName,
        email: reservationData.email,
        phone: reservationData.phone || "",
        nationality: reservationData.nationality || "",
        id_number: reservationData.idNumber || ""
      }));
      setIsEditing(true);
    }
  }, [reservationData, guestId]);

  // Fetch existing guest profile
  const { data: guestProfile, isLoading } = useQuery({
    queryKey: ['guest-profile', guestId],
    queryFn: async () => {
      if (!guestId) return null;
      
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestId)
        .single();

      if (guestError) throw guestError;

      const { data: profile } = await supabase
        .from('guest_profiles')
        .select('*')
        .eq('guest_id', guestId)
        .single();

      return { ...guest, profile };
    },
    enabled: !!guestId,
  });

  // Load guest data into form
  useEffect(() => {
    if (guestProfile) {
      setFormData({
        first_name: guestProfile.first_name || "",
        last_name: guestProfile.last_name || "",
        email: guestProfile.email || "",
        phone: guestProfile.phone || "",
        nationality: guestProfile.nationality || "",
        id_number: guestProfile.id_number || "",
        dob: guestProfile.dob || "",
        address: "",
        city: "",
        country: "",
        preferences: Array.isArray(guestProfile.profile?.preferences) 
          ? guestProfile.profile.preferences as string[]
          : [],
        vip_status: guestProfile.profile?.vip_status || false,
        blacklist_flag: guestProfile.profile?.blacklist_flag || false,
        blacklist_reason: guestProfile.profile?.blacklist_reason || "",
        loyalty_tier: guestProfile.profile?.loyalty_tier || "Standard",
        loyalty_points: guestProfile.profile?.loyalty_points || 0,
        marketing_consent: guestProfile.profile?.marketing_consent || false,
        communication_preferences: typeof guestProfile.profile?.communication_preferences === 'object' 
          ? guestProfile.profile.communication_preferences as { email: boolean; sms: boolean; phone: boolean; whatsapp: boolean; }
          : {
            email: true,
            sms: false,
            phone: false,
            whatsapp: false
          }
      });
    }
  }, [guestProfile]);

  // Upsert guest profile mutation
  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const hotelId = '550e8400-e29b-41d4-a716-446655440001'; // Mock hotel ID
      
      // Check for existing guest by email/phone
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('hotel_id', hotelId)
        .or(`email.eq.${data.email},phone.eq.${data.phone}`)
        .single();

      let guestId = existingGuest?.id;
      let isNew = false;

      if (!guestId) {
        // Create new guest
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            nationality: data.nationality,
            id_number: data.id_number,
            dob: data.dob || null,
            hotel_id: hotelId
          })
          .select()
          .single();

        if (guestError) throw guestError;
        guestId = newGuest.id;
        isNew = true;

        await logGuestCreated(guestId, {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
        });
      } else {
        // Update existing guest
        const { error: updateError } = await supabase
          .from('guests')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            nationality: data.nationality,
            id_number: data.id_number,
            dob: data.dob || null,
          })
          .eq('id', guestId);

        if (updateError) throw updateError;

        await logGuestCreated(guestId, {
          first_name: data.first_name,
          last_name: data.last_name,
        });
      }

      // Upsert guest profile
      const { error: profileError } = await supabase
        .from('guest_profiles')
        .upsert({
          guest_id: guestId,
          preferences: data.preferences,
          vip_status: data.vip_status,
          blacklist_flag: data.blacklist_flag,
          blacklist_reason: data.blacklist_reason,
          loyalty_tier: data.loyalty_tier,
          loyalty_points: data.loyalty_points,
          marketing_consent: data.marketing_consent,
          communication_preferences: data.communication_preferences,
        });

      if (profileError) throw profileError;

      return { guestId, isNew };
    },
    onSuccess: ({ guestId, isNew }) => {
      toast({
        title: isNew ? "Guest Profile Created" : "Guest Profile Updated",
        description: isNew 
          ? "New guest profile has been created successfully" 
          : "Guest profile has been updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['guest-profile'] });
      setIsEditing(false);
      
      if (isNew && onProfileCreated) {
        onProfileCreated(guestId);
      } else if (!isNew && onProfileUpdated) {
        onProfileUpdated(guestId);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save guest profile. Please try again.",
        variant: "destructive",
      });
      console.error('Profile save error:', error);
    }
  });

  const handleSave = () => {
    upsertMutation.mutate(formData);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPreference = (preference: string) => {
    if (preference && !formData.preferences.includes(preference)) {
      updateFormData('preferences', [...formData.preferences, preference]);
    }
  };

  const removePreference = (preference: string) => {
    updateFormData('preferences', formData.preferences.filter(p => p !== preference));
  };

  const getLoyaltyBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'default';
      case 'Gold': return 'secondary';
      case 'Silver': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div>Loading guest profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Guest Profile
            {formData.vip_status && (
              <Badge variant="secondary" className="ml-2">
                <Star className="h-3 w-3 mr-1" />
                VIP
              </Badge>
            )}
            {formData.blacklist_flag && (
              <Badge variant="destructive" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Blacklisted
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {guestId ? "Manage guest information and preferences" : "Create new guest profile"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.first_name}
                  onChange={(e) => updateFormData('first_name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.last_name}
                  onChange={(e) => updateFormData('last_name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Select 
                  value={formData.nationality} 
                  onValueChange={(value) => updateFormData('nationality', value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="idNumber">ID/Passport Number</Label>
                <Input
                  id="idNumber"
                  value={formData.id_number}
                  onChange={(e) => updateFormData('id_number', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => updateFormData('dob', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Loyalty & Status */}
          <div className="space-y-4">
            <h4 className="font-medium">Loyalty & Status</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="loyaltyTier">Loyalty Tier</Label>
                <Select 
                  value={formData.loyalty_tier} 
                  onValueChange={(value) => updateFormData('loyalty_tier', value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="loyaltyPoints">Loyalty Points</Label>
                <Input
                  id="loyaltyPoints"
                  type="number"
                  value={formData.loyalty_points}
                  onChange={(e) => updateFormData('loyalty_points', Number(e.target.value))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Status Flags</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="vip"
                      checked={formData.vip_status}
                      onCheckedChange={(checked) => updateFormData('vip_status', checked)}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="vip">VIP Status</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="blacklist"
                      checked={formData.blacklist_flag}
                      onCheckedChange={(checked) => updateFormData('blacklist_flag', checked)}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="blacklist">Blacklist</Label>
                  </div>
                </div>
              </div>
            </div>

            {formData.blacklist_flag && (
              <div>
                <Label htmlFor="blacklistReason">Blacklist Reason</Label>
                <Textarea
                  id="blacklistReason"
                  value={formData.blacklist_reason}
                  onChange={(e) => updateFormData('blacklist_reason', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter reason for blacklisting..."
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium">Guest Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {formData.preferences.map((preference, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {preference}
                  {isEditing && (
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removePreference(preference)}
                    />
                  )}
                </Badge>
              ))}
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const preference = prompt("Enter new preference:");
                    if (preference) addPreference(preference);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Preference
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Communication Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium">Communication Preferences</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailPref"
                  checked={formData.communication_preferences.email}
                  onCheckedChange={(checked) => 
                    updateFormData('communication_preferences', {
                      ...formData.communication_preferences,
                      email: checked
                    })
                  }
                  disabled={!isEditing}
                />
                <Label htmlFor="emailPref">Email Communications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smsPref"
                  checked={formData.communication_preferences.sms}
                  onCheckedChange={(checked) => 
                    updateFormData('communication_preferences', {
                      ...formData.communication_preferences,
                      sms: checked
                    })
                  }
                  disabled={!isEditing}
                />
                <Label htmlFor="smsPref">SMS Communications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="marketingConsent"
                  checked={formData.marketing_consent}
                  onCheckedChange={(checked) => updateFormData('marketing_consent', checked)}
                  disabled={!isEditing}
                />
                <Label htmlFor="marketingConsent">Marketing Consent</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={upsertMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {upsertMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
            
            <Badge variant={getLoyaltyBadgeVariant(formData.loyalty_tier)}>
              {formData.loyalty_tier} • {formData.loyalty_points} pts
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};