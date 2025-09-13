import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Filter, 
  Star, 
  DollarSign, 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell,
  Utensils,
  Shield,
  MapPin,
  Bed
} from "lucide-react";

interface SearchFilters {
  priceRange: [number, number];
  starRating: number[];
  amenities: string[];
  roomTypes: string[];
  distance: number;
  guestRating: number;
  propertyTypes: string[];
  mealPlans: string[];
}

interface AdvancedSearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
}

const AdvancedSearchFilters = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  onApplyFilters 
}: AdvancedSearchFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const amenityOptions = [
    { value: "wifi", label: "Free WiFi", icon: Wifi },
    { value: "parking", label: "Free Parking", icon: Car },
    { value: "breakfast", label: "Breakfast", icon: Coffee },
    { value: "gym", label: "Fitness Center", icon: Dumbbell },
    { value: "restaurant", label: "Restaurant", icon: Utensils },
    { value: "spa", label: "Spa", icon: Shield },
    { value: "pool", label: "Swimming Pool", icon: Dumbbell },
    { value: "business", label: "Business Center", icon: Coffee }
  ];

  const roomTypeOptions = [
    "Standard Room",
    "Deluxe Room", 
    "Suite",
    "Executive Room",
    "Family Room",
    "Connecting Rooms"
  ];

  const propertyTypeOptions = [
    "Hotel",
    "Resort", 
    "Boutique Hotel",
    "Business Hotel",
    "Apartment",
    "Villa"
  ];

  const mealPlanOptions = [
    "Room Only",
    "Breakfast Included",
    "Half Board", 
    "Full Board",
    "All Inclusive"
  ];

  const handleAmenityToggle = (amenity: string) => {
    const updatedAmenities = localFilters.amenities.includes(amenity)
      ? localFilters.amenities.filter(a => a !== amenity)
      : [...localFilters.amenities, amenity];
    
    setLocalFilters({ ...localFilters, amenities: updatedAmenities });
  };

  const handleStarRatingToggle = (star: number) => {
    const updatedRatings = localFilters.starRating.includes(star)
      ? localFilters.starRating.filter(s => s !== star)
      : [...localFilters.starRating, star];
    
    setLocalFilters({ ...localFilters, starRating: updatedRatings });
  };

  const handleRoomTypeToggle = (roomType: string) => {
    const updatedRoomTypes = localFilters.roomTypes.includes(roomType)
      ? localFilters.roomTypes.filter(rt => rt !== roomType)
      : [...localFilters.roomTypes, roomType];
    
    setLocalFilters({ ...localFilters, roomTypes: updatedRoomTypes });
  };

  const handlePropertyTypeToggle = (propertyType: string) => {
    const updatedPropertyTypes = localFilters.propertyTypes.includes(propertyType)
      ? localFilters.propertyTypes.filter(pt => pt !== propertyType)
      : [...localFilters.propertyTypes, propertyType];
    
    setLocalFilters({ ...localFilters, propertyTypes: updatedPropertyTypes });
  };

  const handleMealPlanToggle = (mealPlan: string) => {
    const updatedMealPlans = localFilters.mealPlans.includes(mealPlan)
      ? localFilters.mealPlans.filter(mp => mp !== mealPlan)
      : [...localFilters.mealPlans, mealPlan];
    
    setLocalFilters({ ...localFilters, mealPlans: updatedMealPlans });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      priceRange: [0, 1000],
      starRating: [],
      amenities: [],
      roomTypes: [],
      distance: 50,
      guestRating: 0,
      propertyTypes: [],
      mealPlans: []
    };
    setLocalFilters(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 1000) count++;
    if (localFilters.starRating.length > 0) count++;
    if (localFilters.amenities.length > 0) count++;
    if (localFilters.roomTypes.length > 0) count++;
    if (localFilters.distance < 50) count++;
    if (localFilters.guestRating > 0) count++;
    if (localFilters.propertyTypes.length > 0) count++;
    if (localFilters.mealPlans.length > 0) count++;
    return count;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Advanced Search Filters</h2>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary">
                    {getActiveFiltersCount()} active
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                {/* Price Range */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Price Range (per night)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="px-3">
                      <Slider
                        value={localFilters.priceRange}
                        onValueChange={(value) => setLocalFilters({ ...localFilters, priceRange: [value[0], value[1]] })}
                        max={1000}
                        min={0}
                        step={25}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>${localFilters.priceRange[0]}</span>
                      <span>${localFilters.priceRange[1]}+</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Star Rating */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Star Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <Button
                          key={star}
                          variant={localFilters.starRating.includes(star) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStarRatingToggle(star)}
                          className="flex items-center gap-1"
                        >
                          {[...Array(star)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" />
                          ))}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Amenities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Amenities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {amenityOptions.map((amenity) => {
                        const Icon = amenity.icon;
                        return (
                          <div key={amenity.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={amenity.value}
                              checked={localFilters.amenities.includes(amenity.value)}
                              onCheckedChange={() => handleAmenityToggle(amenity.value)}
                            />
                            <Label htmlFor={amenity.value} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Icon className="h-3 w-3" />
                              {amenity.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Room Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      Room Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {roomTypeOptions.map((roomType) => (
                        <div key={roomType} className="flex items-center space-x-2">
                          <Checkbox
                            id={roomType}
                            checked={localFilters.roomTypes.includes(roomType)}
                            onCheckedChange={() => handleRoomTypeToggle(roomType)}
                          />
                          <Label htmlFor={roomType} className="text-sm cursor-pointer">
                            {roomType}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Distance & Guest Rating */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Distance from Center
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="px-3">
                        <Slider
                          value={[localFilters.distance]}
                          onValueChange={(value) => setLocalFilters({ ...localFilters, distance: value[0] })}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        Within {localFilters.distance} km
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Guest Rating
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="px-3">
                        <Slider
                          value={[localFilters.guestRating]}
                          onValueChange={(value) => setLocalFilters({ ...localFilters, guestRating: value[0] })}
                          max={10}
                          min={0}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        {localFilters.guestRating > 0 ? `${localFilters.guestRating}+ rating` : "Any rating"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Property Types */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {propertyTypeOptions.map((propertyType) => (
                        <div key={propertyType} className="flex items-center space-x-2">
                          <Checkbox
                            id={propertyType}
                            checked={localFilters.propertyTypes.includes(propertyType)}
                            onCheckedChange={() => handlePropertyTypeToggle(propertyType)}
                          />
                          <Label htmlFor={propertyType} className="text-sm cursor-pointer">
                            {propertyType}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Meal Plans */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Meal Plans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {mealPlanOptions.map((mealPlan) => (
                        <div key={mealPlan} className="flex items-center space-x-2">
                          <Checkbox
                            id={mealPlan}
                            checked={localFilters.mealPlans.includes(mealPlan)}
                            onCheckedChange={() => handleMealPlanToggle(mealPlan)}
                          />
                          <Label htmlFor={mealPlan} className="text-sm cursor-pointer">
                            {mealPlan}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t bg-muted/20">
              <Button variant="outline" onClick={handleReset}>
                Reset All
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleApply} className="bg-primary hover:bg-primary/90">
                  Apply Filters ({getActiveFiltersCount()})
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdvancedSearchFilters;