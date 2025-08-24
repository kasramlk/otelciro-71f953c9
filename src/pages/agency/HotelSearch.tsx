import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookingFlowModal from "@/components/agency/BookingFlowModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  SlidersHorizontal
} from "lucide-react";

const HotelSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const mockHotels = [
    {
      id: 1,
      name: "Grand Hyatt Istanbul",
      location: "Taksim, Istanbul",
      stars: 5,
      rating: 4.8,
      reviews: 2847,
      image: "/placeholder.svg",
      amenities: ["Wifi", "Pool", "Gym", "Spa", "Restaurant", "Parking"],
      rooms: [
        { type: "Deluxe Room", price: 285, currency: "USD", available: 5 },
        { type: "Executive Suite", price: 450, currency: "USD", available: 2 }
      ],
      distance: "0.5 km to city center"
    },
    {
      id: 2,
      name: "Four Seasons Bosphorus",
      location: "Beşiktaş, Istanbul", 
      stars: 5,
      rating: 4.9,
      reviews: 1923,
      image: "/placeholder.svg",
      amenities: ["Wifi", "Pool", "Spa", "Restaurant", "Concierge"],
      rooms: [
        { type: "Bosphorus View Room", price: 520, currency: "USD", available: 3 },
        { type: "Premium Suite", price: 890, currency: "USD", available: 1 }
      ],
      distance: "1.2 km to city center"
    },
    {
      id: 3,
      name: "Swissôtel The Bosphorus",
      location: "Beşiktaş, Istanbul",
      stars: 5,
      rating: 4.7,
      reviews: 3156,
      image: "/placeholder.svg", 
      amenities: ["Wifi", "Pool", "Gym", "Spa", "Restaurant", "Business Center"],
      rooms: [
        { type: "Superior Room", price: 195, currency: "USD", available: 8 },
        { type: "Bosphorus Suite", price: 380, currency: "USD", available: 4 }
      ],
      distance: "2.1 km to city center"
    }
  ];

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

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Simulate AI-powered search - in production, this would call an AI service
      // For now, we'll just simulate the delay and show mock results
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would implement:
      // 1. Parse natural language query using AI
      // 2. Search hotel database based on parsed criteria
      // 3. Return ranked results
      
      console.log('AI Search Query:', searchQuery);
    } catch (error) {
      console.error('Search error:', error);
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
            <Badge variant="secondary">{mockHotels.length} hotels found</Badge>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Sort & Filter
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {mockHotels.map((hotel, index) => (
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