import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookingFlowModal from "@/components/agency/BookingFlowModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedHotels } from "@/hooks/use-enhanced-hotels";
import { checkRealTimeAvailability, getRealTimeRates } from "@/lib/services/booking-service";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell,
  Utensils,
  Shield,
  Filter,
  SlidersHorizontal,
  Loader2
} from "lucide-react";

const HotelSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    city: "Istanbul",
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults: 2,
    children: 0
  });
  const [enrichedHotels, setEnrichedHotels] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { data: hotels = [], isLoading: hotelsLoading, error } = useEnhancedHotels(searchFilters);

  const amenityIcons = {
    "Wifi": Wifi,
    "Pool": Dumbbell, // Using Dumbbell as Pool icon replacement
    "Gym": Dumbbell,
    "Spa": Shield,
    "Restaurant": Utensils,
    "Parking": Car,
    "Concierge": Users,
    "Business Center": Coffee
  };

  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [bookingAction, setBookingAction] = useState<'book' | 'quote' | 'view' | null>(null);

  const handleBookHotel = (hotel: any) => {
    setSelectedHotel(hotel);
    setBookingAction('book');
  };

  const handleViewDetails = (hotel: any) => {
    setSelectedHotel(hotel);
    setBookingAction('view');
  };

  const handleRequestQuote = (hotel: any) => {
    setSelectedHotel(hotel);
    setBookingAction('quote');
  };

  // Enrich hotels with real-time availability and rates
  useEffect(() => {
    const enrichHotelsWithRealTimeData = async () => {
      if (!hotels.length || !searchFilters.checkIn || !searchFilters.checkOut) return;
      
      setLoading(true);
      try {
        const enrichedData = await Promise.all(
          hotels.map(async (hotel) => {
            const enrichedRoomTypes = await Promise.all(
              hotel.room_types.map(async (roomType: any) => {
                const [availability, rates] = await Promise.all([
                  checkRealTimeAvailability(hotel.id, roomType.id, searchFilters.checkIn, searchFilters.checkOut),
                  getRealTimeRates(hotel.id, roomType.id, searchFilters.checkIn, searchFilters.checkOut)
                ]);

                return {
                  id: roomType.id,
                  type: roomType.name,
                  description: roomType.description,
                  price: Math.round(rates.averageRate),
                  available: availability.availableRooms,
                  currency: "USD"
                };
              })
            );

            // Filter out unavailable room types
            const availableRooms = enrichedRoomTypes.filter(room => room.available > 0);

            return {
              id: hotel.id,
              name: hotel.name,
              location: `${hotel.city}, ${hotel.country}`,
              stars: 4, // Default rating
              rating: 4.5 + Math.random() * 0.5,
              reviews: Math.floor(1000 + Math.random() * 2000),
              image: "/placeholder.svg",
              amenities: ["Wifi", "Restaurant", "Reception", "Concierge"],
              rooms: availableRooms,
              distance: `${(Math.random() * 3 + 0.1).toFixed(1)} km to city center`,
              address: hotel.address
            };
          })
        );

        // Filter hotels that have available rooms
        const availableHotels = enrichedData.filter(hotel => hotel.rooms.length > 0);
        setEnrichedHotels(availableHotels);
      } catch (error) {
        console.error('Error enriching hotel data:', error);
        toast({
          title: "Search Error",
          description: "Failed to load real-time rates and availability",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    enrichHotelsWithRealTimeData();
  }, [hotels, searchFilters, toast]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Parse natural language query and update filters
      // For now, simple keyword extraction
      if (searchQuery.toLowerCase().includes('istanbul')) {
        setSearchFilters(prev => ({ ...prev, city: 'Istanbul' }));
      }
      
      // Trigger re-fetch by updating search filters
      setSearchFilters(prev => ({ ...prev }));
      
      console.log('AI Search Query:', searchQuery);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to process search query",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              AI-Powered Hotel Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Try: 'Find me a 5-star hotel in Istanbul with pool and spa for business travelers'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg py-6"
                />
              </div>
              <Button 
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-8 py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90"
          >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Search
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Destination</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Check-in / Check-out</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Guests</span>
              </div>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search Results */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Search Results</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {loading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : null}
              {enrichedHotels.length} hotels found
            </Badge>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Sort & Filter
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <p className="text-destructive">Failed to load hotels. Please try again.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {enrichedHotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    {/* Hotel Image */}
                    <div className="md:col-span-1">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <MapPin className="h-8 w-8 text-primary" />
                          </div>
                          <p className="text-sm">Hotel Image</p>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{hotel.name}</h3>
                          <div className="flex">
                            {[...Array(hotel.stars)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {hotel.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>★ {hotel.rating}</span>
                            <span>({hotel.reviews} reviews)</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{hotel.distance}</p>
                      </div>

                      {/* Amenities */}
                      <div>
                        <p className="text-sm font-medium mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {hotel.amenities.slice(0, 6).map((amenity) => {
                            const Icon = amenityIcons[amenity] || Shield;
                            return (
                              <Badge key={amenity} variant="outline" className="text-xs">
                                <Icon className="mr-1 h-3 w-3" />
                                {amenity}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      {/* Room Types */}
                      <div>
                        <p className="text-sm font-medium mb-2">Available Rooms</p>
                        <div className="space-y-2">
                          {hotel.rooms.map((room, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div>
                                <p className="font-medium text-sm">{room.type}</p>
                                <p className="text-xs text-muted-foreground">{room.available} rooms available</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">${room.price}</p>
                                <p className="text-xs text-muted-foreground">per night</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Booking Actions */}
                    <div className="md:col-span-1 flex flex-col justify-between">
                      <div className="text-right mb-4">
                        <p className="text-sm text-muted-foreground">Starting from</p>
                        <p className="text-2xl font-bold text-primary">${Math.min(...hotel.rooms.map(r => r.price))}</p>
                        <p className="text-sm text-muted-foreground">per night</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90"
                          onClick={() => handleBookHotel(hotel)}
                        >
                          Book Now
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleViewDetails(hotel)}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full text-sm"
                          onClick={() => handleRequestQuote(hotel)}
                        >
                          Request Quote
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center">
          <Button variant="outline" className="px-8">
            Load More Hotels
          </Button>
        </div>
      </div>

      {/* Booking Flow Modal */}
      {selectedHotel && bookingAction && (
        <BookingFlowModal
          open={true}
          onClose={() => {
            setSelectedHotel(null);
            setBookingAction(null);
          }}
          hotel={selectedHotel}
          action={bookingAction}
        />
      )}
    </div>
  );
};

export default HotelSearch;