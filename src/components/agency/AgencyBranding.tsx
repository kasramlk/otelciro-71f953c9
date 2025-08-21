import { ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface AgencyBrandingProps {
  children: ReactNode;
  agencyId?: string;
}

interface BrandingConfig {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  theme_name?: string;
  custom_domain?: string;
}

const defaultBranding: BrandingConfig = {
  primary_color: "212 100% 25%", // Hotel blue
  secondary_color: "199 100% 47%", // Ocean blue
  accent_color: "45 100% 50%", // Gold
  theme_name: "OtelCiro"
};

export const AgencyBranding = ({ children, agencyId }: AgencyBrandingProps) => {
  const { data: agency } = useQuery({
    queryKey: ['agency-branding', agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      
      const { data, error } = await supabase
        .from('agencies')
        .select('name, contact_email, address, branding_config')
        .eq('id', agencyId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!agencyId
  });

  useEffect(() => {
    if (agency?.branding_config) {
      const branding: BrandingConfig = { ...defaultBranding, ...agency.branding_config };
      
      // Apply custom CSS variables for white-label theming
      const root = document.documentElement;
      
      if (branding.primary_color) {
        root.style.setProperty('--agency-primary', branding.primary_color);
        root.style.setProperty('--primary', branding.primary_color);
      }
      
      if (branding.secondary_color) {
        root.style.setProperty('--agency-secondary', branding.secondary_color);
        root.style.setProperty('--secondary', branding.secondary_color);
      }
      
      if (branding.accent_color) {
        root.style.setProperty('--agency-accent', branding.accent_color);
        root.style.setProperty('--accent', branding.accent_color);
      }
      
      // Update page title
      if (branding.theme_name || agency.name) {
        document.title = `${branding.theme_name || agency.name} - Travel Portal`;
      }
    }

    return () => {
      // Cleanup - restore default values
      const root = document.documentElement;
      root.style.removeProperty('--agency-primary');
      root.style.removeProperty('--agency-secondary');
      root.style.removeProperty('--agency-accent');
    };
  }, [agency]);

  return (
    <div className="agency-branded">
      {children}
    </div>
  );
};