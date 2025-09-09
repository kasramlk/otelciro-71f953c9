import { createContext, useContext } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Hotel = Database['public']['Tables']['hotels']['Row'];

interface HotelContextType {
  selectedHotelId: string | null;
  setSelectedHotelId: (id: string | null) => void;
  selectedHotel: Hotel | null;
}

export const HotelContext = createContext<HotelContextType | null>(null);

export const useHotelContext = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotelContext must be used within a HotelProvider');
  }
  return context;
};