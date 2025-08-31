import React from "react";
import { supabase } from "@/integrations/supabase/client";

// Test component to authenticate with Beds24
export function TestBeds24Auth() {
  const testAuth = async () => {
    try {
      console.log('Testing Beds24 authentication...');
      
      const { data, error } = await supabase.functions.invoke('beds24-auth', {
        body: {
          action: 'setup',
          invitationCode: 'bmpeQh0N9bhGPMkqArjh/Qd8KCVvzzbO3DVuviJu72qg+v6RyGZnHA4J5nEgaJa7Op5NqgjVAnnfrcq0tOL0Ke+qgkxOCh2vFcBYiaU0AdPnul/Ej+uCNajWSsFz3Mavy4eL9Cb+5S0XVqZ7E+B3L1OLQkhtqVSC/Bdh2UpJhAI=',
          hotelId: '550e8400-e29b-41d4-a716-446655440000',
          deviceName: 'OtelCiro-PMS'
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        return;
      }

      console.log('📋 Full response:', data);

      if (data && data.success) {
        console.log('✅ Beds24 authentication successful!');
        console.log('🔗 Connection ID:', data.data.connectionId);
        console.log('🔑 Access Token received:', !!data.data.accessToken);
        console.log('🔄 Refresh Token received:', !!data.data.refreshToken);
        console.log('⏰ Expires in:', data.data.expiresIn, 'seconds');
        
        // Now let's check if the connection was stored in the database
        const { data: connections, error: dbError } = await supabase
          .from('beds24_connections')
          .select('*')
          .eq('hotel_id', '550e8400-e29b-41d4-a716-446655440000')
          .order('created_at', { ascending: false })
          .limit(1);

        if (dbError) {
          console.error('❌ Database query error:', dbError);
        } else {
          console.log('💾 Connection stored in database:', connections?.[0] ? 'Yes' : 'No');
          if (connections?.[0]) {
            console.log('📊 Connection details:', {
              id: connections[0].id,
              account_id: connections[0].account_id,
              is_active: connections[0].is_active,
              created_at: connections[0].created_at
            });
          }
        }
        
      } else {
        console.error('❌ Authentication failed:', data?.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  };

  // Auto-run the test
  React.useEffect(() => {
    testAuth();
  }, []);

  return <div>Testing Beds24 Authentication (check console)...</div>;
}