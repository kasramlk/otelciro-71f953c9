import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Calendar,
  Eye,
  FileX,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// DateRangePicker not available, using placeholder
import { useHMSStore } from "@/stores/hms-store";
import { useToast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";

interface Discrepancy {
  id: string;
  type: 'Rate' | 'Availability' | 'Restriction' | 'Inventory';
  channel: string;
  roomType: string;
  date: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Resolved' | 'Ignored';
  hotelValue: string | number;
  channelValue: string | number;
  difference: string | number;
  lastUpdated: string;
  description: string;
}

// Mock data
const mockDiscrepancies: Discrepancy[] = [
  {
    id: '1',
    type: 'Rate',
    channel: 'Booking.com',
    roomType: 'Standard Double',
    date: '2024-01-16',
    severity: 'High',
    status: 'Open',
    hotelValue: 120,
    channelValue: 110,
    difference: -10,
    lastUpdated: '2024-01-15 14:30:00',
    description: 'Rate mismatch detected during sync'
  },
  {
    id: '2',
    type: 'Availability',
    channel: 'Expedia',
    roomType: 'Standard Double',
    date: '2024-01-17',
    severity: 'Medium',
    status: 'Open',
    hotelValue: 5,
    channelValue: 3,
    difference: -2,
    lastUpdated: '2024-01-15 13:45:00',
    description: 'Availability count differs between systems'
  },
  {
    id: '3',
    type: 'Restriction',
    channel: 'Airbnb',
    roomType: 'Deluxe Suite',
    date: '2024-01-18',
    severity: 'Low',
    status: 'Resolved',
    hotelValue: 'No Check-in',
    channelValue: 'Available',
    difference: 'Mismatch',
    lastUpdated: '2024-01-15 12:15:00',
    description: 'Check-in restriction not synchronized'
  },
  {
    id: '4',
    type: 'Rate',
    channel: 'Booking.com',
    roomType: 'Deluxe Suite',
    date: '2024-01-19',
    severity: 'High',
    status: 'Open',
    hotelValue: 250,
    channelValue: 275,
    difference: 25,
    lastUpdated: '2024-01-15 11:30:00',
    description: 'Rate difference exceeds threshold'
  },
  {
    id: '5',
    type: 'Inventory',
    channel: 'Expedia',
    roomType: 'Standard Double',
    date: '2024-01-20',
    severity: 'Medium',
    status: 'Ignored',
    hotelValue: 10,
    channelValue: 8,
    difference: -2,
    lastUpdated: '2024-01-15 10:45:00',
    description: 'Minor inventory variance within acceptable range'
  }
];

export const HMSChannelReconciliation = () => {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>(mockDiscrepancies);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 7)
  });
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  const { addAuditEntry } = useHMSStore();
  const { toast } = useToast();

  // Filter discrepancies
  const filteredDiscrepancies = useMemo(() => {
    return discrepancies.filter(discrepancy => {
      const matchesSearch = 
        discrepancy.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discrepancy.roomType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discrepancy.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === "all" || discrepancy.type === typeFilter;
      const matchesChannel = channelFilter === "all" || discrepancy.channel === channelFilter;
      const matchesSeverity = severityFilter === "all" || discrepancy.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || discrepancy.status === statusFilter;
      
      return matchesSearch && matchesType && matchesChannel && matchesSeverity && matchesStatus;
    });
  }, [discrepancies, searchQuery, typeFilter, channelFilter, severityFilter, statusFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = discrepancies.length;
    const open = discrepancies.filter(d => d.status === 'Open').length;
    const resolved = discrepancies.filter(d => d.status === 'Resolved').length;
    const high = discrepancies.filter(d => d.severity === 'High').length;
    
    return { total, open, resolved, high };
  }, [discrepancies]);

  const handleRunReconciliation = async () => {
    toast({ title: "Running reconciliation across all channels..." });
    
    // Simulate reconciliation process
    setTimeout(() => {
      const newDiscrepancies = [
        {
          id: Date.now().toString(),
          type: 'Rate' as const,
          channel: 'Booking.com',
          roomType: 'Standard Double',
          date: format(new Date(), 'yyyy-MM-dd'),
          severity: 'Medium' as const,
          status: 'Open' as const,
          hotelValue: 135,
          channelValue: 130,
          difference: -5,
          lastUpdated: new Date().toLocaleString(),
          description: 'New rate discrepancy found during reconciliation'
        }
      ];
      
      setDiscrepancies(prev => [...newDiscrepancies, ...prev]);
      addAuditEntry('Channel Reconciliation', `Reconciliation completed - ${newDiscrepancies.length} new discrepancies found`);
      toast({ title: `Reconciliation completed - ${newDiscrepancies.length} new discrepancies found` });
    }, 3000);
  };

  const handleResolveDiscrepancy = (discrepancyId: string, action: 'resolve' | 'ignore') => {
    setDiscrepancies(prev => prev.map(d => 
      d.id === discrepancyId 
        ? { ...d, status: action === 'resolve' ? 'Resolved' : 'Ignored' }
        : d
    ));
    
    const discrepancy = discrepancies.find(d => d.id === discrepancyId);
    if (discrepancy) {
      addAuditEntry(
        'Discrepancy Resolution', 
        `${action === 'resolve' ? 'Resolved' : 'Ignored'} ${discrepancy.type} discrepancy for ${discrepancy.channel} - ${discrepancy.roomType}`
      );
      toast({ 
        title: `Discrepancy ${action === 'resolve' ? 'resolved' : 'ignored'} successfully` 
      });
    }
    
    setSelectedDiscrepancy(null);
    setShowResolveDialog(false);
  };

  const handleExportDiscrepancies = () => {
    const csvData = filteredDiscrepancies.map(d => 
      `${d.date},${d.type},${d.channel},${d.roomType},${d.severity},${d.status},${d.hotelValue},${d.channelValue},${d.difference},"${d.description}"`
    );
    
    const csvContent = [
      'Date,Type,Channel,Room Type,Severity,Status,Hotel Value,Channel Value,Difference,Description',
      ...csvData
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `channel_discrepancies_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    addAuditEntry('Export', 'Channel discrepancies exported to CSV');
    toast({ title: "Discrepancies exported successfully" });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'text-red-600 bg-red-50';
      case 'Resolved':
        return 'text-green-600 bg-green-50';
      case 'Ignored':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifferenceIcon = (difference: string | number) => {
    if (typeof difference === 'number') {
      if (difference > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
      if (difference < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Channel Reconciliation</h1>
          <p className="text-muted-foreground">Monitor and resolve data discrepancies across channels</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRunReconciliation}
            className="bg-gradient-primary text-white hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Reconciliation
          </Button>
          <Button variant="outline" onClick={handleExportDiscrepancies}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Discrepancies</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileX className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Severity</p>
                <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search discrepancies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Rate">Rate</SelectItem>
                <SelectItem value="Availability">Availability</SelectItem>
                <SelectItem value="Restriction">Restriction</SelectItem>
                <SelectItem value="Inventory">Inventory</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="Booking.com">Booking.com</SelectItem>
                <SelectItem value="Expedia">Expedia</SelectItem>
                <SelectItem value="Airbnb">Airbnb</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Discrepancies ({filteredDiscrepancies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hotel Value</TableHead>
                <TableHead>Channel Value</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscrepancies.map((discrepancy) => (
                <TableRow key={discrepancy.id}>
                  <TableCell className="font-medium">
                    {format(new Date(discrepancy.date), 'MMM dd')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{discrepancy.type}</Badge>
                  </TableCell>
                  <TableCell>{discrepancy.channel}</TableCell>
                  <TableCell>{discrepancy.roomType}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(discrepancy.severity)}>
                      {discrepancy.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(discrepancy.status)}>
                      {discrepancy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{discrepancy.hotelValue}</TableCell>
                  <TableCell>{discrepancy.channelValue}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getDifferenceIcon(discrepancy.difference)}
                      <span>{discrepancy.difference}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedDiscrepancy(discrepancy)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {discrepancy.status === 'Open' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedDiscrepancy(discrepancy);
                            setShowResolveDialog(true);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDiscrepancies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No discrepancies found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discrepancy Details Dialog */}
      {selectedDiscrepancy && !showResolveDialog && (
        <Dialog open={!!selectedDiscrepancy} onOpenChange={() => setSelectedDiscrepancy(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Discrepancy Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedDiscrepancy.type}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <div className="mt-1">
                    <Badge className={getSeverityColor(selectedDiscrepancy.severity)}>
                      {selectedDiscrepancy.severity}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Channel</Label>
                  <div className="mt-1 text-sm">{selectedDiscrepancy.channel}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Room Type</Label>
                  <div className="mt-1 text-sm">{selectedDiscrepancy.roomType}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <div className="mt-1 text-sm">{format(new Date(selectedDiscrepancy.date), 'PPP')}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedDiscrepancy.status)}>
                      {selectedDiscrepancy.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Value Comparison</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-600 font-medium">Hotel Value</p>
                    <p className="text-lg font-bold">{selectedDiscrepancy.hotelValue}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <p className="text-sm text-orange-600 font-medium">Channel Value</p>
                    <p className="text-lg font-bold">{selectedDiscrepancy.channelValue}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600 font-medium">Difference</p>
                    <div className="flex items-center justify-center gap-1">
                      {getDifferenceIcon(selectedDiscrepancy.difference)}
                      <span className="text-lg font-bold">{selectedDiscrepancy.difference}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="mt-1 p-3 bg-muted rounded text-sm">
                  {selectedDiscrepancy.description}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Last updated: {selectedDiscrepancy.lastUpdated}
              </div>

              {selectedDiscrepancy.status === 'Open' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleResolveDiscrepancy(selectedDiscrepancy.id, 'resolve')}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleResolveDiscrepancy(selectedDiscrepancy.id, 'ignore')}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Ignore
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};