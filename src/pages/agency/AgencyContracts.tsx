import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, DollarSign, FileText, Plus } from "lucide-react";

const AgencyContracts = () => {
  const contracts = [
    {
      id: "1",
      hotelName: "Grand Marina Hotel",
      city: "Barcelona",
      contractType: "Standard Rate",
      commissionRate: "12%",
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      status: "active",
      totalBookings: 45,
      totalCommission: 8450
    },
    {
      id: "2", 
      hotelName: "Sunset Resort & Spa",
      city: "Santorini",
      contractType: "Preferred Rate",
      commissionRate: "15%",
      validFrom: "2024-03-01",
      validUntil: "2024-10-31",
      status: "active",
      totalBookings: 28,
      totalCommission: 6200
    },
    {
      id: "3",
      hotelName: "City Business Hotel",
      city: "Madrid",
      contractType: "Volume Rate", 
      commissionRate: "18%",
      validFrom: "2024-02-01",
      validUntil: "2025-01-31",
      status: "pending",
      totalBookings: 0,
      totalCommission: 0
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hotel Contracts</h1>
          <p className="text-muted-foreground">Manage your hotel rate agreements and negotiations</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => (
          <Card key={contract.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                  {contract.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-lg">{contract.hotelName}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {contract.city}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contract Type:</span>
                  <span className="font-medium">{contract.contractType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission Rate:</span>
                  <span className="font-medium text-green-600">{contract.commissionRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valid Period:</span>
                  <span className="font-medium text-xs">
                    {new Date(contract.validFrom).toLocaleDateString()} - {new Date(contract.validUntil).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Bookings:</span>
                  <span className="font-medium">{contract.totalBookings}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Commission:</span>
                  <span className="font-medium text-green-600">${contract.totalCommission.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Negotiate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgencyContracts;