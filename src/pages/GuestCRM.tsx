import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Star, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Gift, 
  TrendingUp,
  Search,
  Filter,
  UserPlus,
  Heart,
  Crown,
  Award,
  Phone,
  MapPin
} from "lucide-react";

const GuestCRM = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock guest data - in real app from Supabase
  const mockGuests = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 555-0123",
      loyaltyTier: "Gold",
      loyaltyPoints: 2450,
      totalStays: 12,
      totalSpent: 8940,
      lastStay: "2024-01-15",
      nextReservation: "2024-03-20",
      preferences: ["Non-smoking", "High floor", "Late checkout"],
      avatar: null,
      status: "VIP",
      tags: ["Business Traveler", "Loyal Guest"]
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "m.chen@company.com",
      phone: "+1 555-0456",
      loyaltyTier: "Platinum",
      loyaltyPoints: 4280,
      totalStays: 23,
      totalSpent: 15640,
      lastStay: "2024-01-10",
      nextReservation: null,
      preferences: ["Gym access", "Executive lounge", "Early breakfast"],
      avatar: null,
      status: "Regular",
      tags: ["Corporate", "Frequent Guest"]
    },
    {
      id: 3,
      name: "Emma Williams",
      email: "emma.w@travel.com",
      phone: "+1 555-0789",
      loyaltyTier: "Silver",
      loyaltyPoints: 1580,
      totalStays: 7,
      totalSpent: 4320,
      lastStay: "2024-01-08",
      nextReservation: "2024-02-28",
      preferences: ["Spa access", "Room service", "Pool view"],
      avatar: null,
      status: "Regular",
      tags: ["Leisure", "Spa Lover"]
    }
  ];

  const loyaltyStats = {
    totalMembers: 1847,
    activeMembers: 1632,
    pointsIssued: 284750,
    pointsRedeemed: 156890,
    avgPointsPerMember: 174
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-gray-800 text-white';
      case 'Gold': return 'bg-yellow-500 text-white';
      case 'Silver': return 'bg-gray-400 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Platinum': return Crown;
      case 'Gold': return Award;
      case 'Silver': return Star;
      default: return Users;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Guest CRM</h2>
          <p className="text-muted-foreground">Manage guest relationships, loyalty programs, and personalized experiences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="mr-2 h-4 w-4 text-primary" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{loyaltyStats.totalMembers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Loyalty program members</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Heart className="mr-2 h-4 w-4 text-red-500" />
                Active Members
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{loyaltyStats.activeMembers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Engaged in last 90 days</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Gift className="mr-2 h-4 w-4 text-purple-500" />
                Points Issued
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{loyaltyStats.pointsIssued.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total loyalty points</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-blue-500" />
                Points Redeemed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{loyaltyStats.pointsRedeemed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully redeemed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Star className="mr-2 h-4 w-4 text-yellow-500" />
                Avg Points/Member
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{loyaltyStats.avgPointsPerMember}</div>
              <p className="text-xs text-muted-foreground mt-1">Average balance</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="guests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="guests">Guest Directory</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search guests by name, email, phone, or preferences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  Advanced Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guest List */}
          <div className="grid gap-6">
            {mockGuests.map((guest, index) => {
              const TierIcon = getTierIcon(guest.loyaltyTier);
              return (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-4 gap-6">
                        {/* Guest Info */}
                        <div className="md:col-span-2">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold">{guest.name}</h3>
                                <Badge className={getTierColor(guest.loyaltyTier)}>
                                  <TierIcon className="mr-1 h-3 w-3" />
                                  {guest.loyaltyTier}
                                </Badge>
                                {guest.status === 'VIP' && (
                                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                                    VIP
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {guest.email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {guest.phone}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-3">
                                {guest.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Guest Stats */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{guest.totalStays}</div>
                              <div className="text-xs text-muted-foreground">Total Stays</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">${guest.totalSpent.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Total Spent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">{guest.loyaltyPoints}</div>
                              <div className="text-xs text-muted-foreground">Points</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium">{guest.lastStay}</div>
                              <div className="text-xs text-muted-foreground">Last Stay</div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button className="w-full">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Message
                          </Button>
                          <Button variant="outline" className="w-full">
                            View Profile
                          </Button>
                          {guest.nextReservation && (
                            <div className="text-center p-2 bg-blue-50 rounded-lg mt-2">
                              <div className="text-sm font-medium text-blue-800">Next Stay</div>
                              <div className="text-xs text-blue-600">{guest.nextReservation}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-sm">Guest Preferences:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {guest.preferences.map((pref, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {pref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="loyalty">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Loyalty Program Management</h3>
                <p className="text-muted-foreground">
                  Configure tiers, rewards, point values, and redemption rules for your loyalty program.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Guest Communications</h3>
                <p className="text-muted-foreground">
                  Manage automated messages, email campaigns, and personalized guest communications.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Guest Analytics</h3>
                <p className="text-muted-foreground">
                  Analyze guest behavior, loyalty program performance, and engagement metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuestCRM;