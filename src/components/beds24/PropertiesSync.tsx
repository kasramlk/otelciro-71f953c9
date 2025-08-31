import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, RefreshCw, CheckCircle } from 'lucide-react';
import { useBeds24Properties, useSyncBeds24Properties } from '@/hooks/use-beds24';
import { useToast } from '@/hooks/use-toast';

interface PropertiesSyncProps {
  connectionId: string;
  hotelId: string;
}

export function PropertiesSync({ connectionId, hotelId }: PropertiesSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  
  // Fetch existing properties
  const { data: properties, isLoading, refetch } = useBeds24Properties(connectionId);
  const syncMutation = useSyncBeds24Properties();

  const handleSync = async () => {
    setSyncing(true);
    try {
      console.log('Starting properties sync...');
      const result = await syncMutation.mutateAsync(connectionId);
      
      if (result.success) {
        const propertiesCount = result.data?.length || 0;
        toast({
          title: "Properties synced successfully!",
          description: `${propertiesCount} properties have been imported from Beds24.`,
        });
      } else {
        throw new Error(result.error || 'Sync failed');
      }
      
      await refetch();
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync properties from Beds24.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Beds24 Properties
        </CardTitle>
        <CardDescription>
          Sync and manage your properties from Beds24
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {properties?.length || 0} properties found
          </div>
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            size="sm"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Properties
              </>
            )}
          </Button>
        </div>

        {properties && properties.length > 0 ? (
          <div className="space-y-3">
            {properties.map((property: any) => (
              <div 
                key={property.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{property.property_name}</h4>
                    {property.sync_enabled && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sync Enabled
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Property ID: {property.beds24_property_id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last synced: {property.last_rates_sync 
                      ? new Date(property.last_rates_sync).toLocaleDateString() 
                      : 'Never'}
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={property.property_status === 'active' ? 'default' : 'secondary'}
                  >
                    {property.property_status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Properties Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Sync Properties" to import your properties from Beds24
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}