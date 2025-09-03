import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

interface DirectImportButtonProps {
  hotelId: string;
  beds24PropertyId: string;
}

export const DirectImportButton: React.FC<DirectImportButtonProps> = ({
  hotelId,
  beds24PropertyId
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleDirectImport = async () => {
    setIsImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('beds24-direct-import', {
        body: {
          hotelId,
          beds24PropertyId
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Import Successful!",
          description: `Imported: ${data.imported.properties} properties, ${data.imported.rooms} rooms, ${data.imported.bookings} bookings, ${data.imported.calendar} calendar entries`,
        });
      } else {
        throw new Error(data?.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || 'Failed to import data from Beds24',
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Button
      onClick={handleDirectImport}
      disabled={isImporting}
      variant="default"
      size="lg"
    >
      {isImporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Importing from Beds24...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Direct Import from Beds24
        </>
      )}
    </Button>
  );
};