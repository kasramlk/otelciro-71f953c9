import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Filter,
  Calendar,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useChannelStore } from '@/stores/channel-store';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const ChannelReconciliation: React.FC = () => {
  const {
    roomTypes,
    ratePlans,
    ariValues,
    inventoryCalendar,
    gdsSnapshots,
    selectedDateRange,
    fetchGDSSnapshots,
    compareWithGDS,
    forceFullRefresh,
    addAuditEntry,
  } = useChannelStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedRatePlan, setSelectedRatePlan] = useState<string>('all');
  const [showDiffsOnly, setShowDiffsOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<any>(null);

  // Get comparison data
  const differences = useMemo(() => {
    return compareWithGDS();
  }, [compareWithGDS]);

  // Filter differences
  const filteredDifferences = useMemo(() => {
    let filtered = differences;

    if (showDiffsOnly) {
      filtered = filtered.filter(diff => diff.rateDiff || diff.availDiff);
    }

    if (selectedRoomType !== 'all') {
      filtered = filtered.filter(diff => diff.roomTypeId === selectedRoomType);
    }

    if (selectedRatePlan !== 'all') {
      filtered = filtered.filter(diff => diff.ratePlanId === selectedRatePlan);
    }

    if (searchTerm) {
      const roomType = roomTypes.find(rt => rt.id === selectedRoomType);
      const ratePlan = ratePlans.find(rp => rp.id === selectedRatePlan);
      
      filtered = filtered.filter(diff => {
        const rt = roomTypes.find(r => r.id === diff.roomTypeId);
        const rp = ratePlans.find(r => r.id === diff.ratePlanId);
        
        return (
          rt?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rt?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rp?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rp?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          diff.date.includes(searchTerm)
        );
      });
    }

    return filtered;
  }, [differences, showDiffsOnly, selectedRoomType, selectedRatePlan, searchTerm, roomTypes, ratePlans]);

  // Statistics
  const stats = useMemo(() => {
    const total = differences.length;
    const rateDiffs = differences.filter(d => d.rateDiff).length;
    const availDiffs = differences.filter(d => d.availDiff).length;
    const bothDiffs = differences.filter(d => d.rateDiff && d.availDiff).length;
    
    return { total, rateDiffs, availDiffs, bothDiffs };
  }, [differences]);

  // Fetch GDS snapshots
  const handleFetchSnapshots = async () => {
    setIsLoading(true);
    try {
      await fetchGDSSnapshots();
      toast({ title: 'GDS snapshots fetched successfully' });
      
      addAuditEntry({
        actor: 'User',
        action: 'Fetch GDS Snapshots',
        entityType: 'GDSSnapshot',
        entityId: 'fetch',
        summary: `Fetched GDS snapshots for reconciliation`,
        payload: { dateRange: selectedDateRange },
      });
    } catch (error) {
      toast({ 
        title: 'Error fetching snapshots', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Force full refresh
  const handleForceRefresh = async () => {
    setIsLoading(true);
    try {
      await forceFullRefresh(selectedDateRange);
      toast({ title: 'Full refresh initiated successfully' });
      
      addAuditEntry({
        actor: 'User',
        action: 'Force Full Refresh',
        entityType: 'ARI',
        entityId: 'refresh',
        summary: `Initiated full ARI refresh for date range ${selectedDateRange.from} to ${selectedDateRange.to}`,
        payload: { dateRange: selectedDateRange },
      });
    } catch (error) {
      toast({ 
        title: 'Error during refresh', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export differences as CSV
  const handleExportCSV = () => {
    const csvData = [
      ['Date', 'Room Type', 'Rate Plan', 'PMS Rate', 'GDS Rate', 'PMS Availability', 'GDS Availability', 'Rate Diff', 'Availability Diff'],
      ...filteredDifferences.map(diff => {
        const roomType = roomTypes.find(rt => rt.id === diff.roomTypeId);
        const ratePlan = ratePlans.find(rp => rp.id === diff.ratePlanId);
        
        return [
          diff.date,
          roomType?.name || '',
          ratePlan?.name || '',
          (diff.pmsRate / 100).toFixed(2),
          (diff.gdsRate / 100).toFixed(2),
          diff.pmsAvail.toString(),
          diff.gdsAvail.toString(),
          diff.rateDiff ? 'Yes' : 'No',
          diff.availDiff ? 'Yes' : 'No'
        ];
      })
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reconciliation_differences.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Differences exported successfully' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Channel Reconciliation</h1>
          <p className="text-muted-foreground">
            Compare PMS data with mini-GDS snapshots to identify discrepancies
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleFetchSnapshots} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Fetch Snapshots
          </Button>
          <Button variant="outline" onClick={handleForceRefresh} disabled={isLoading}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Force Full Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Comparisons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.rateDiffs}</div>
            <p className="text-xs text-muted-foreground">Rate Differences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.availDiffs}</div>
            <p className="text-xs text-muted-foreground">Availability Differences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.bothDiffs}</div>
            <p className="text-xs text-muted-foreground">Both Different</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="col-span-2">
              <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Room Types</SelectItem>
                  {roomTypes.map(rt => (
                    <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Select value={selectedRatePlan} onValueChange={setSelectedRatePlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Rate Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rate Plans</SelectItem>
                  {ratePlans.map(rp => (
                    <SelectItem key={rp.id} value={rp.id}>{rp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Select value={showDiffsOnly ? 'diffs' : 'all'} onValueChange={(v) => setShowDiffsOnly(v === 'diffs')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show All</SelectItem>
                  <SelectItem value="diffs">Differences Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Badge variant="secondary" className="h-10 px-4 flex items-center justify-center w-full">
                {filteredDifferences.length} items
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Differences Table */}
      <Card>
        <CardHeader>
          <CardTitle>PMS vs mini-GDS Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredDifferences.map((diff, index) => {
              const roomType = roomTypes.find(rt => rt.id === diff.roomTypeId);
              const ratePlan = ratePlans.find(rp => rp.id === diff.ratePlanId);
              
              return (
                <motion.div
                  key={`${diff.date}-${diff.roomTypeId}-${diff.ratePlanId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "grid grid-cols-12 gap-4 p-4 rounded-lg border transition-colors",
                    (diff.rateDiff || diff.availDiff) && "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800",
                    "hover:bg-accent cursor-pointer"
                  )}
                  onClick={() => setSelectedDiff(diff)}
                >
                  {/* Date */}
                  <div className="col-span-2">
                    <div className="font-medium">{format(parseISO(diff.date), 'MMM dd')}</div>
                    <div className="text-xs text-muted-foreground">{format(parseISO(diff.date), 'yyyy')}</div>
                  </div>

                  {/* Room Type */}
                  <div className="col-span-2">
                    <div className="font-medium">{roomType?.name}</div>
                    <div className="text-xs text-muted-foreground">{roomType?.code}</div>
                  </div>

                  {/* Rate Plan */}
                  <div className="col-span-2">
                    <div className="font-medium">{ratePlan?.name}</div>
                    <div className="text-xs text-muted-foreground">{ratePlan?.code}</div>
                  </div>

                  {/* Rate Comparison */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">€{(diff.pmsRate / 100).toFixed(0)}</span>
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">€{(diff.gdsRate / 100).toFixed(0)}</span>
                    </div>
                    {diff.rateDiff && (
                      <div className="flex items-center gap-1 mt-1">
                        {diff.pmsRate > diff.gdsRate ? (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-green-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          €{Math.abs(diff.pmsRate - diff.gdsRate) / 100}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Availability Comparison */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{diff.pmsAvail}</span>
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{diff.gdsAvail}</span>
                    </div>
                    {diff.availDiff && (
                      <div className="flex items-center gap-1 mt-1">
                        {diff.pmsAvail > diff.gdsAvail ? (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-green-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {Math.abs(diff.pmsAvail - diff.gdsAvail)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {diff.rateDiff && diff.availDiff ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Both
                      </Badge>
                    ) : diff.rateDiff ? (
                      <Badge variant="destructive" className="text-xs">
                        Rate
                      </Badge>
                    ) : diff.availDiff ? (
                      <Badge variant="secondary" className="text-xs">
                        Availability
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        Synced
                      </Badge>
                    )}
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredDifferences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {differences.length === 0 
                ? "No comparison data available. Click 'Fetch Snapshots' to load GDS data."
                : "No differences found matching your filter criteria."
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDiff} onOpenChange={() => setSelectedDiff(null)}>
        <DialogContent className="max-w-2xl">
          {selectedDiff && (
            <DifferenceDetail 
              difference={selectedDiff}
              roomTypes={roomTypes}
              ratePlans={ratePlans}
              onClose={() => setSelectedDiff(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Difference Detail Component
const DifferenceDetail: React.FC<{
  difference: any;
  roomTypes: any[];
  ratePlans: any[];
  onClose: () => void;
}> = ({ difference, roomTypes, ratePlans, onClose }) => {
  const roomType = roomTypes.find(rt => rt.id === difference.roomTypeId);
  const ratePlan = ratePlans.find(rp => rp.id === difference.ratePlanId);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reconciliation Details</DialogTitle>
        <DialogDescription>
          Detailed comparison for {format(parseISO(difference.date), 'PPP')}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Room Type</Label>
            <div className="font-medium">{roomType?.name}</div>
            <div className="text-sm text-muted-foreground">{roomType?.code}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Rate Plan</Label>
            <div className="font-medium">{ratePlan?.name}</div>
            <div className="text-sm text-muted-foreground">{ratePlan?.code}</div>
          </div>
        </div>

        <Separator />

        {/* Rate Comparison */}
        <div>
          <Label className="text-sm font-medium">Rate Comparison</Label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">PMS Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{(difference.pmsRate / 100).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">mini-GDS Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{(difference.gdsRate / 100).toFixed(2)}</div>
                {difference.rateDiff && (
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant={difference.pmsRate > difference.gdsRate ? "destructive" : "default"}>
                      {difference.pmsRate > difference.gdsRate ? "Higher" : "Lower"} by €{Math.abs(difference.pmsRate - difference.gdsRate) / 100}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Availability Comparison */}
        <div>
          <Label className="text-sm font-medium">Availability Comparison</Label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">PMS Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{difference.pmsAvail}</div>
                <div className="text-sm text-muted-foreground">rooms available</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">mini-GDS Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{difference.gdsAvail}</div>
                <div className="text-sm text-muted-foreground">rooms available</div>
                {difference.availDiff && (
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant={difference.pmsAvail > difference.gdsAvail ? "destructive" : "default"}>
                      {difference.pmsAvail > difference.gdsAvail ? "Higher" : "Lower"} by {Math.abs(difference.pmsAvail - difference.gdsAvail)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </>
  );
};

export default ChannelReconciliation;