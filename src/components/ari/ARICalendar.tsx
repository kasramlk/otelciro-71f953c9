import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Bed, 
  DollarSign, 
  Package, 
  TrendingUp, 
  AlertCircle,
  Edit,
  Save,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";

const ARICalendar = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ date: string; roomType: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Mock ARI data - in real app this would come from Supabase
  const ariData = {
    "2024-01-15": {
      "Deluxe Room": { availability: 8, rate: 185, inventory: 12, restrictions: "Min 2N" },
      "Suite": { availability: 3, rate: 350, inventory: 6, restrictions: null },
      "Standard": { availability: 15, rate: 120, inventory: 20, restrictions: null }
    },
    "2024-01-16": {
      "Deluxe Room": { availability: 5, rate: 195, inventory: 12, restrictions: "CTA" },
      "Suite": { availability: 2, rate: 380, inventory: 6, restrictions: "Min 3N" },
      "Standard": { availability: 12, rate: 135, inventory: 20, restrictions: null }
    },
    "2024-01-17": {
      "Deluxe Room": { availability: 0, rate: 220, inventory: 12, restrictions: "STOP SELL" },
      "Suite": { availability: 1, rate: 420, inventory: 6, restrictions: null },
      "Standard": { availability: 8, rate: 150, inventory: 20, restrictions: null }
    }
  };

  const dates = Object.keys(ariData);
  const roomTypes = ["Deluxe Room", "Suite", "Standard"];

  const getAvailabilityColor = (availability: number, inventory: number) => {
    const percentage = (availability / inventory) * 100;
    if (percentage === 0) return "bg-red-500 text-white";
    if (percentage < 25) return "bg-red-100 text-red-800";
    if (percentage < 50) return "bg-yellow-100 text-yellow-800";
    if (percentage < 75) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const handleCellEdit = (date: string, roomType: string, field: string, currentValue: any) => {
    setEditingCell({ date, roomType, field });
    setEditValue(currentValue.toString());
  };

  const handleSaveEdit = () => {
    // In real app, save to database
    console.log("Saving edit:", editingCell, editValue);
    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ARI Calendar</h2>
          <p className="text-muted-foreground">Availability, Rates & Inventory Management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Calendar className="mr-1 h-3 w-3" />
            Live Sync Active
          </Badge>
          <Button variant="outline">
            Bulk Update
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="sync">Channel Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                ARI Grid - Real-time Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Room Type</th>
                      {dates.map((date) => (
                        <th key={date} className="text-center p-2 font-medium min-w-32">
                          <div>{new Date(date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roomTypes.map((roomType) => (
                      <tr key={roomType} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">
                          <div className="flex items-center gap-2">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            {roomType}
                          </div>
                        </td>
                        {dates.map((date) => {
                          const data = ariData[date]?.[roomType];
                          if (!data) return <td key={date} className="p-2">-</td>;
                          
                          return (
                            <td key={`${date}-${roomType}`} className="p-2">
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={`p-3 rounded-lg border transition-all ${getAvailabilityColor(data.availability, data.inventory)}`}
                              >
                                {/* Availability */}
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">Avail:</span>
                                  {editingCell?.date === date && editingCell?.roomType === roomType && editingCell?.field === 'availability' ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-6 w-12 text-xs"
                                      />
                                      <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-6 w-6 p-0">
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span 
                                      className="font-bold cursor-pointer flex items-center gap-1"
                                      onClick={() => handleCellEdit(date, roomType, 'availability', data.availability)}
                                    >
                                      {data.availability}/{data.inventory}
                                      <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </span>
                                  )}
                                </div>
                                
                                {/* Rate */}
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">Rate:</span>
                                  {editingCell?.date === date && editingCell?.roomType === roomType && editingCell?.field === 'rate' ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-6 w-16 text-xs"
                                      />
                                      <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-6 w-6 p-0">
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span 
                                      className="font-bold cursor-pointer flex items-center gap-1"
                                      onClick={() => handleCellEdit(date, roomType, 'rate', data.rate)}
                                    >
                                      ${data.rate}
                                      <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </span>
                                  )}
                                </div>
                                
                                {/* Restrictions */}
                                {data.restrictions && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-xs font-medium">{data.restrictions}</span>
                                  </div>
                                )}
                              </motion.div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Availability Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100"></div>
                  <span className="text-sm">75-100% Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100"></div>
                  <span className="text-sm">50-74% Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-100"></div>
                  <span className="text-sm">25-49% Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100"></div>
                  <span className="text-sm">1-24% Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-sm">Sold Out</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">ARI Analytics</h3>
                <p className="text-muted-foreground">
                  Advanced analytics for availability, rate trends, and inventory optimization coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Channel Synchronization</h3>
                <p className="text-muted-foreground">
                  Real-time sync with OTAs and channel partners. Configure sync settings and monitor updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ARICalendar;