import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users, Bed, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useHMSStore } from '@/stores/hms-store';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'reservation' | 'guest' | 'room' | 'payment' | 'maintenance';
  title: string;
  subtitle: string;
  metadata: string;
  relevance: number;
  data: any;
}

interface GlobalSearchProps {
  onNavigate?: (type: string, id: string) => void;
  className?: string;
}

export const GlobalSearch = ({ onNavigate, className = '' }: GlobalSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { reservations, rooms, guests } = useHMSStore();

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate search delay
    const searchTimeout = setTimeout(() => {
      const searchResults: SearchResult[] = [];

      // Search reservations
      reservations.forEach(reservation => {
        const searchText = `${reservation.guestName} ${reservation.roomNumber || reservation.roomType} ${reservation.code}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          searchResults.push({
            id: reservation.id,
            type: 'reservation',
            title: `Reservation - ${reservation.guestName}`,
            subtitle: `${reservation.roomNumber ? `Room ${reservation.roomNumber}` : reservation.roomType}`,
            metadata: `${format(reservation.checkIn, 'MMM dd')} - ${format(reservation.checkOut, 'MMM dd')}`,
            relevance: calculateRelevance(searchText, query),
            data: reservation
          });
        }
      });

      // Search guests
      guests.forEach(guest => {
        const guestName = `${guest.firstName} ${guest.lastName}`;
        const searchText = `${guestName} ${guest.email} ${guest.phone}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          searchResults.push({
            id: guest.id,
            type: 'guest',
            title: guestName,
            subtitle: guest.email,
            metadata: `${guest.totalStays} stays • ${guest.totalSpent > 0 ? `€${guest.totalSpent}` : 'New guest'}`,
            relevance: calculateRelevance(searchText, query),
            data: guest
          });
        }
      });

      // Search rooms
      rooms.forEach(room => {
        const searchText = `${room.number} ${room.roomType} ${room.status}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          searchResults.push({
            id: room.id,
            type: 'room',
            title: `Room ${room.number}`,
            subtitle: room.roomType,
            metadata: `${room.status} • ${room.condition}`,
            relevance: calculateRelevance(searchText, query),
            data: room
          });
        }
      });

      // Mock search for payments
      if (query.toLowerCase().includes('payment') || query.toLowerCase().includes('€')) {
        searchResults.push({
          id: 'payment-1',
          type: 'payment',
          title: 'Payment Record',
          subtitle: '€250.00 - Card Payment',
          metadata: 'Today • Confirmed',
          relevance: 0.8,
          data: { amount: 250, method: 'card' }
        });
      }

      // Sort by relevance
      setResults(searchResults.sort((a, b) => b.relevance - a.relevance));
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(searchTimeout);
  }, [query, reservations, rooms, guests]);

  const calculateRelevance = (text: string, query: string): number => {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower === queryLower) return 1.0;
    if (textLower.startsWith(queryLower)) return 0.9;
    if (textLower.includes(queryLower)) return 0.7;
    
    const words = queryLower.split(' ');
    const matches = words.filter(word => textLower.includes(word)).length;
    return matches / words.length * 0.6;
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'reservation': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'guest': return <Users className="h-4 w-4 text-green-500" />;
      case 'room': return <Bed className="h-4 w-4 text-purple-500" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-yellow-500" />;
      default: return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onNavigate?.(result.type, result.id);
    setIsOpen(false);
    setQuery('');
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search reservations, guests, rooms..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 left-0 right-0 z-50"
          >
            <Card className="border shadow-lg">
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-6 text-center">
                    <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {query ? `No results found for "${query}"` : 'Start typing to search...'}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(groupedResults).map(([type, typeResults], index) => (
                      <div key={type}>
                        {index > 0 && <Separator />}
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                            {type}s ({typeResults.length})
                          </h4>
                          <div className="space-y-1">
                            {typeResults.slice(0, 5).map((result) => (
                              <motion.div
                                key={result.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => handleResultClick(result)}
                              >
                                {getResultIcon(result.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{result.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                  <p className="text-xs text-muted-foreground">{result.metadata}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {Math.round(result.relevance * 100)}%
                                  </Badge>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {results.length > 15 && (
                      <div className="p-3 border-t text-center">
                        <p className="text-xs text-muted-foreground">
                          Showing first {Math.min(15, results.length)} of {results.length} results
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};