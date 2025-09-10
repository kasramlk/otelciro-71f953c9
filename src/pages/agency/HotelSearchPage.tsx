import { HotelInventorySearch } from "@/components/agency/HotelInventorySearch";

const HotelSearchPage = () => {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Hotel Search & Booking</h1>
        <p className="text-muted-foreground">Search and book from all hotels using Otelciro PMS</p>
      </div>
      
      <HotelInventorySearch />
    </div>
  );
};

export default HotelSearchPage;