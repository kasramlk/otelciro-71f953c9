import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle, Download } from 'lucide-react';

interface PropertiesTestProps {
  className?: string;
}

export default function PropertiesTest({ className }: PropertiesTestProps) {
  const [propertyId, setPropertyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  
  // Filter options state
  const [filters, setFilters] = useState({
    includeLanguages: true,
    includeTexts: true,
    includePictures: true,
    includeOffers: true,
    includePriceRules: true,
    includeUpsellItems: true,
    includeAllRooms: true,
    includeUnitDetails: true,
  });

  const testPropertiesConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const requestBody = {
        operation: 'properties',
        params: {
          ...(propertyId.trim() && { id: [parseInt(propertyId.trim())] }),
          // Add enabled filters
          ...(filters.includeLanguages && { includeLanguages: ['en'] }),
          ...(filters.includeTexts && { includeTexts: ['property', 'roomType'] }),
          ...(filters.includePictures && { includePictures: true }),
          ...(filters.includeOffers && { includeOffers: true }),
          ...(filters.includePriceRules && { includePriceRules: true }),
          ...(filters.includeUpsellItems && { includeUpsellItems: true }),
          ...(filters.includeAllRooms && { includeAllRooms: true }),
          ...(filters.includeUnitDetails && { includeUnitDetails: true }),
        }
      };

      console.log('Making Beds24 properties request:', requestBody);

      const { data, error } = await supabase.functions.invoke('beds24-exec', {
        body: requestBody
      });

      if (error) {
        throw error;
      }

      setResponse(data);
      toast.success(`Successfully retrieved ${Array.isArray(data.data) ? data.data.length : 1} properties from Beds24`);
    } catch (err: any) {
      console.error('Beds24 properties error:', err);
      setError(err.message || 'Failed to fetch properties');
      toast.error(err.message || 'Failed to fetch properties');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResponse = () => {
    if (!response) return;
    
    const blob = new Blob([JSON.stringify(response, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beds24-properties-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Properties API Test
          </CardTitle>
          <CardDescription>
            Test the Beds24 Properties API with all available filters and parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property ID Input */}
          <div className="space-y-2">
            <Label htmlFor="propertyId">Property ID (Optional)</Label>
            <Input
              id="propertyId"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="Enter specific property ID or leave empty for all properties"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to fetch all accessible properties, or enter a specific property ID
            </p>
          </div>

          {/* Filter Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">API Filters</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(filters).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                  <Label htmlFor={key} className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Test Button */}
          <Button 
            onClick={testPropertiesConnection} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Properties...
              </>
            ) : (
              'Fetch Properties from Beds24'
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Response Display */}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Response Received</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadResponse}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </div>

              {/* Response Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Operation</div>
                  <div className="font-medium">{response.operation}</div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Properties Found</div>
                  <div className="font-medium">
                    {Array.isArray(response.data) ? response.data.length : 1}
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Credits Remaining</div>
                  <div className="font-medium">{response.creditInfo?.remaining || 'N/A'}</div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Request Cost</div>
                  <div className="font-medium">{response.creditInfo?.requestCost || 'N/A'}</div>
                </div>
              </div>

              {/* Properties Data */}
              {Array.isArray(response.data) && response.data.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Properties Data</Label>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {response.data.map((property: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{property.name || `Property ${property.id}`}</h4>
                          <Badge variant="outline">ID: {property.id}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span> {property.type || 'N/A'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">City:</span> {property.city || 'N/A'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Country:</span> {property.countryCode || 'N/A'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rooms:</span> {property.rooms?.length || 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Response */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Raw API Response</Label>
                <Textarea
                  value={JSON.stringify(response, null, 2)}
                  readOnly
                  className="font-mono text-xs max-h-64"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}