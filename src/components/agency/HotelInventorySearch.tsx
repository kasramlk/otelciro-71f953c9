import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  MapPin, 
  Building2, 
  Users, 
  Star,
  Calendar,
  DollarSign,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";

interface HotelWithRooms {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  room_types: Array<{
    id: string;
    name: string;
    capacity_adults: number;
    capacity_children: number;
    description: string;
  }>;
  rate_plans: Array<{
    id: string;
    name: string;
    currency: string;
    description: string;
  }>;
}

export const HotelInventorySearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Fetch all hotels with their room types and rate plans
  const { data: hotels, isLoading } = useQuery({
    queryKey: ['agency-hotels', searchTerm, selectedCity],
    queryFn: async () => {
      let query = supabase
        .from('hotels')
        .select(`
          *,
          room_types(*),
          rate_plans(*)
        `);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`);
      }

      if (selectedCity) {
        query = query.eq('city', selectedCity);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data as HotelWithRooms[];
    },
  });

  // Get unique cities for filter
  const { data: cities } = useQuery({
    queryKey: ['hotel-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('city')
        .not('city', 'is', null)
        .order('city');
      
      if (error) throw error;
      return [...new Set(data.map(h => h.city))].filter(Boolean);
    },
  });

  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Hotel Inventory Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Hotels</label>
              <Input 
                placeholder="Hotel name, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">City</label>
              <select 
                className="w-full p-2 border rounded-md bg-background"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">All Cities</option>
                {cities?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Check-in</label>
              <Input 
                type="date"
                value={checkInDate}
                min={today}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Check-out</label>
              <Input 
                type="date"
                value={checkOutDate}
                min={checkInDate || today}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Loading hotels...</div>
          </div>
        ) : hotels && hotels.length > 0 ? (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {hotels.length} Hotels Found
              </h3>
              <Badge variant="outline">
                {hotels.reduce((sum, hotel) => sum + hotel.room_types.length, 0)} Room Types Available
              </Badge>
            </div>

            <div className="grid gap-6">
              {hotels.map((hotel, index) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <HotelCard 
                    hotel={hotel} 
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                  />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hotels found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

interface HotelCardProps {
  hotel: HotelWithRooms;
  checkInDate: string;
  checkOutDate: string;
}

const HotelCard = ({ hotel, checkInDate, checkOutDate }: HotelCardProps) => {
  const [showRates, setShowRates] = useState(false);

  // Fetch current rates for this hotel if dates are selected
  const { data: currentRates } = useQuery({
    queryKey: ['hotel-rates', hotel.id, checkInDate, checkOutDate],
    queryFn: async () => {
      if (!checkInDate || !checkOutDate) return null;

      const { data, error } = await supabase
        .from('daily_rates')
        .select(`
          *,
          room_type:room_types(*),
          rate_plan:rate_plans(*)
        `)
        .eq('hotel_id', hotel.id)
        .gte('date', checkInDate)
        .lte('date', checkOutDate);

      if (error) throw error;
      return data;
    },
    enabled: !!(checkInDate && checkOutDate),
  });

  // Calculate average rates per room type
  const averageRates = currentRates?.reduce((acc, rate) => {
    const key = rate.room_type_id;
    if (!acc[key]) {
      acc[key] = {
        room_type: rate.room_type,
        rates: [],
        total: 0,
        count: 0
      };
    }
    acc[key].rates.push(rate.rate);
    acc[key].total += Number(rate.rate);
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, any>);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {hotel.name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {hotel.city}, {hotel.country}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {hotel.room_types.length} Room Types
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary">{hotel.rate_plans.length} Rate Plans</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Hotel Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Address:</strong> {hotel.address || 'Not specified'}
          </div>
          <div>
            <strong>Contact:</strong> {hotel.phone || hotel.email || 'Not specified'}
          </div>
        </div>

        <Separator />

        {/* Room Types */}
        <div>
          <h4 className="font-medium mb-3">Available Room Types</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hotel.room_types.map((roomType) => {
              const avgRate = averageRates?.[roomType.id];
              const averagePrice = avgRate ? (avgRate.total / avgRate.count).toFixed(2) : null;

              return (
                <div key={roomType.id} className="border rounded-lg p-3 bg-muted/30">
                  <div className="font-medium">{roomType.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Up to {roomType.capacity_adults} adults, {roomType.capacity_children} children
                  </div>
                  {roomType.description && (
                    <div className="text-xs text-muted-foreground mb-2">
                      {roomType.description}
                    </div>
                  )}
                  {averagePrice && (
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <DollarSign className="h-3 w-3" />
                      Avg: ${averagePrice}/night
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rate Plans */}
        <div>
          <h4 className="font-medium mb-3">Rate Plans</h4>
          <div className="flex flex-wrap gap-2">
            {hotel.rate_plans.map((ratePlan) => (
              <Badge key={ratePlan.id} variant="outline">
                {ratePlan.name} ({ratePlan.currency})
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowRates(!showRates)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {showRates ? 'Hide' : 'View'} Rates
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90">
            Book Now
          </Button>
        </div>

        {/* Rate Details */}
        {showRates && currentRates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-4"
          >
            <h5 className="font-medium mb-3">Rate Details ({checkInDate} to {checkOutDate})</h5>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {Object.values(averageRates || {}).map((rateData: any) => (
                <div key={rateData.room_type.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{rateData.room_type.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {rateData.count} nights available
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ${(rateData.total / rateData.count).toFixed(2)}/night
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: ${rateData.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};