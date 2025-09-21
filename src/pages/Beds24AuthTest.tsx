import { Beds24AuthDemo } from '@/components/beds24/Beds24AuthDemo';

export default function Beds24AuthTest() {
  // Using the organization ID from your database
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Beds24 Authentication Test</h1>
          <p className="text-muted-foreground">
            Test the secure Beds24 integration with invite code authentication
          </p>
        </div>
        
        <Beds24AuthDemo organizationId={organizationId} />
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Credentials</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Organization ID:</strong> 
              <code className="ml-2 bg-background px-2 py-1 rounded">
                {organizationId}
              </code>
            </div>
            <div>
              <strong>Invite Code:</strong> 
              <span className="ml-2 text-muted-foreground">
                Get this from your Beds24 control panel → Settings → API
              </span>
            </div>
            <div>
              <strong>Device Name:</strong> 
              <span className="ml-2 text-muted-foreground">
                OtelCiro Demo (or any name you prefer)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}