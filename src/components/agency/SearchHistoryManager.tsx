import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  History, 
  Heart, 
  MapPin, 
  Calendar, 
  Users, 
  Trash2,
  Search,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { SearchParams } from "@/hooks/use-enhanced-hotel-search";

interface SearchHistoryManagerProps {
  searchHistory: SearchParams[];
  favoriteHotels: string[];
  onSearchSelect: (searchParams: SearchParams) => void;
  onClearHistory: () => void;
  onRemoveFavorite: (hotelId: string) => void;
}

const SearchHistoryManager = ({ 
  searchHistory, 
  favoriteHotels, 
  onSearchSelect, 
  onClearHistory,
  onRemoveFavorite 
}: SearchHistoryManagerProps) => {
  
  // Mock favorite hotels data (in real app, this would come from API)
  const mockFavoriteHotels = [
    {
      id: "1",
      name: "Grand Hyatt Istanbul",
      location: "Istanbul, Turkey",
      stars: 5,
      rating: 4.8,
      lowestPrice: 285,
      image: "/placeholder.svg"
    },
    {
      id: "2", 
      name: "Four Seasons Bosphorus",
      location: "Istanbul, Turkey",
      stars: 5,
      rating: 4.9,
      lowestPrice: 520,
      image: "/placeholder.svg"
    }
  ].filter(hotel => favoriteHotels.includes(hotel.id));

  const formatSearchParams = (params: SearchParams) => {
    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...params,
      nights,
      checkInFormatted: format(checkInDate, 'MMM dd'),
      checkOutFormatted: format(checkOutDate, 'MMM dd')
    };
  };

  return (
    <div className="space-y-6">
      {/* Search History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Recent Searches
            </CardTitle>
            {searchHistory.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearHistory}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {searchHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent searches</p>
              <p className="text-sm">Your search history will appear here</p>
            </div>
          ) : (
            searchHistory.slice(0, 5).map((search, index) => {
              const formattedSearch = formatSearchParams(search);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSearchSelect(search)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formattedSearch.destination}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formattedSearch.checkInFormatted} - {formattedSearch.checkOutFormatted}</span>
                          <Badge variant="outline" className="text-xs ml-1">
                            {formattedSearch.nights} nights
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>
                            {formattedSearch.adults} adults
                            {formattedSearch.children > 0 && `, ${formattedSearch.children} children`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Favorite Hotels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Favorite Hotels
            {mockFavoriteHotels.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {mockFavoriteHotels.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockFavoriteHotels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No favorite hotels yet</p>
              <p className="text-sm">Save hotels you like for quick access</p>
            </div>
          ) : (
            mockFavoriteHotels.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{hotel.name}</h4>
                        <div className="flex">
                          {[...Array(hotel.stars)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {hotel.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>★ {hotel.rating}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-muted-foreground">From </span>
                        <span className="font-bold text-primary">${hotel.lowestPrice}</span>
                        <span className="text-muted-foreground"> per night</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onRemoveFavorite(hotel.id)}
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start">
              <MapPin className="mr-2 h-4 w-4" />
              Popular Destinations
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Weekend Getaways
            </Button>
            <Button variant="outline" className="justify-start">
              <Star className="mr-2 h-4 w-4" />
              Top Rated Hotels
            </Button>
            <Button variant="outline" className="justify-start">
              <Heart className="mr-2 h-4 w-4" />
              Special Offers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchHistoryManager;