// Test script for Beds24 authentication
const SUPABASE_URL = 'https://zldcotumxouasgzdsvmh.supabase.co';
const INVITATION_CODE = 'bmpeQh0N9bhGPMkqArjh/Qd8KCVvzzbO3DVuviJu72qg+v6RyGZnHA4J5nEgaJa7Op5NqgjVAnnfrcq0tOL0Ke+qgkxOCh2vFcBYiaU0AdPnul/Ej+uCNajWSsFz3Mavy4eL9Cb+5S0XVqZ7E+B3L1OLQkhtqVSC/Bdh2UpJhAI=';
const HOTEL_ID = '550e8400-e29b-41d4-a716-446655440000';

async function testBeds24Auth() {
  try {
    console.log('Testing Beds24 authentication with invitation code...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/beds24-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZGNvdHVteG91YXNnemRzdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjY5NDEsImV4cCI6MjA3MTI0Mjk0MX0.tMMHzRMpmm4lLvRq27M1O7rcOsUnYr2bFEki3TdqFeQ'
      },
      body: JSON.stringify({
        action: 'setup',
        invitationCode: INVITATION_CODE,
        hotelId: HOTEL_ID,
        deviceName: 'OtelCiro-PMS-Test'
      })
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Authentication successful!');
      console.log('Connection ID:', result.data.connectionId);
      console.log('Access Token:', result.data.accessToken ? 'Received' : 'Missing');
      console.log('Refresh Token:', result.data.refreshToken ? 'Received' : 'Missing');
    } else {
      console.log('❌ Authentication failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing authentication:', error);
  }
}

testBeds24Auth();