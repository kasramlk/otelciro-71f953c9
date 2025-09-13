import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookingFlowModal from "@/components/agency/BookingFlowModal";
import AdvancedSearchFilters from "@/components/agency/AdvancedSearchFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedHotelSearch, SearchFilters, SearchParams, EnrichedHotel } from "@/hooks/use-enhanced-hotel-search";
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
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const HotelSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useState<SearchParams>({
    destination: "Istanbul",
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults: 2,
    children: 0,
    rooms: 1
  });
  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: [0, 1000],
    starRating: [],
    amenities: [],
    roomTypes: [],
    distance: 50,
    guestRating: 0,
    propertyTypes: [],
    mealPlans: []
  });
  const [sortBy, setSortBy] = useState("price-low");
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<EnrichedHotel[]>([]);
  
  const { toast } = useToast();
  const { 
    search, 
    isSearching, 
    searchHistory, 
    favoriteHotels, 
    toggleFavorite, 
    sortHotels,
    error 
  } = useEnhancedHotelSearch(searchParams, filters);

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

  const [selectedHotel, setSelectedHotel] = useState<EnrichedHotel | null>(null);
  const [bookingAction, setBookingAction] = useState<'book' | 'quote' | 'view' | null>(null);

  const handleBookHotel = (hotel: EnrichedHotel) => {
    setSelectedHotel(hotel);
    setBookingAction('book');
  };

  const handleViewDetails = (hotel: EnrichedHotel) => {
    setSelectedHotel(hotel);
    setBookingAction('view');
  };

  const handleRequestQuote = (hotel: EnrichedHotel) => {
    setSelectedHotel(hotel);
    setBookingAction('quote');
  };

  // Perform search and apply filters
  useEffect(() => {
    const performSearch = async () => {
      const results = await search();
      const sortedResults = sortHotels(results, sortBy);
      setSearchResults(sortedResults);
    };

    if (searchParams.destination) {
      performSearch();
    }
  }, [search, searchParams, filters, sortBy, sortHotels]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search query to find hotels.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Parse natural language query and update search parameters
      const lowerQuery = searchQuery.toLowerCase();
      
      // Extract city/destination
      const cityPatterns = [
        /in\s+([a-zA-Z\s]+?)(?:\s+for|\s+with|$)/,
        /hotel(?:s)?\s+in\s+([a-zA-Z\s]+?)(?:\s+for|\s+with|$)/,
        /find.*?in\s+([a-zA-Z\s]+?)(?:\s+for|\s+with|$)/
      ];
      
      for (const pattern of cityPatterns) {
        const match = lowerQuery.match(pattern);
        if (match) {
          const city = match[1].trim();
          setSearchParams(prev => ({ 
            ...prev, 
            destination: city.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
          }));
          break;
        }
      }
      
      // Extract guest count
      const guestPattern = /(\d+)\s+(?:adult|guest|people|person)/;
      const guestMatch = lowerQuery.match(guestPattern);
      if (guestMatch) {
        setSearchParams(prev => ({ 
          ...prev, 
          adults: parseInt(guestMatch[1])
        }));
      }

      // Extract children count
      const childPattern = /(\d+)\s+(?:child|children|kid)/;
      const childMatch = lowerQuery.match(childPattern);
      if (childMatch) {
        setSearchParams(prev => ({ 
          ...prev, 
          children: parseInt(childMatch[1])
        }));
      }
      
      toast({
        title: "Search Updated",
        description: "Hotel search has been updated based on your query.",
      });
      
    } catch (error) {
      console.error('Search processing error:', error);
      toast({
        title: "Search Error",
        description: "Failed to process search query. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFiltersApply = () => {
    // Filters are automatically applied via useEffect
    toast({
      title: "Filters Applied",
      description: `Search results updated with your preferences.`,
    });
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
              disabled={isSearching}
              className="px-8 py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90"
            >
              {isSearching ? (
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
              <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Filters Modal */}
      <AdvancedSearchFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={handleFiltersApply}
      />

      {/* Sorting and Results Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Guest Rating</SelectItem>
              <SelectItem value="stars">Star Rating</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Search Results</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {isSearching ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : null}
              {searchResults.length} hotels found
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
          {searchResults.map((hotel, index) => (
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