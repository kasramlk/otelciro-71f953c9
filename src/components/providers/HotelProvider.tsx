import { useState, ReactNode } from 'react';
import { HotelContext } from '@/hooks/use-hotel-context';
import { useHotels, useHotel } from '@/hooks/use-production-data';

interface HotelProviderProps {
  children: ReactNode;
}

export const HotelProvider = ({ children }: HotelProviderProps) => {
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const { data: hotels } = useHotels();
  const { data: selectedHotel } = useHotel(selectedHotelId || '');

  // Auto-select first hotel if available and none selected
  if (!selectedHotelId && hotels && hotels.length > 0) {
    setSelectedHotelId(hotels[0].id);
  }

  return (
    <HotelContext.Provider
      value={{
        selectedHotelId,
        setSelectedHotelId,
        selectedHotel: selectedHotel || null,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};