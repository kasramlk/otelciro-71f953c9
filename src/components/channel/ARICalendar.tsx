import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FixedSizeGrid as Grid } from 'react-window';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { 
  Calendar, 
  Copy, 
  Clipboard, 
  Undo2, 
  Redo2, 
  Upload, 
  Download,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { useChannelStore } from '@/stores/channel-store';
import { cn } from '@/lib/utils';

interface CellData {
  rowIndex: number;
  columnIndex: number;
  style: React.CSSProperties;
}

const ARICalendar: React.FC = () => {
  const {
    roomTypes,
    ratePlans,
    ariValues,
    inventoryCalendar,
    selectedDateRange,
    selectedRoomTypes,
    selectedRatePlans,
    activeTab,
    pendingChanges,
    channelMappings,
    setActiveTab,
    updateARIValue,
    bulkUpdateARI,
    clearPendingChanges,
    enqueuePublish,
    addAuditEntry,
  } = useChannelStore();

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [copiedData, setCopiedData] = useState<any>(null);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [expandedRoomTypes, setExpandedRoomTypes] = useState<Set<string>>(new Set(roomTypes.map(rt => rt.id)));
  
  const gridRef = useRef<Grid>(null);

  // Generate date columns
  const dateColumns = useMemo(() => {
    const { from, to } = selectedDateRange;
    const startDate = parseISO(from);
    const endDate = parseISO(to);
    const dates = [];
    
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  }, [selectedDateRange]);

  // Generate grid rows (room types + rate plans)
  const gridRows = useMemo(() => {
    const rows: Array<{ type: 'roomType' | 'ratePlan'; roomType: any; ratePlan?: any; key: string }> = [];
    
    roomTypes
      .filter(rt => selectedRoomTypes.includes(rt.id))
      .forEach(roomType => {
        rows.push({ type: 'roomType', roomType, key: `rt-${roomType.id}` });
        
        if (expandedRoomTypes.has(roomType.id)) {
          ratePlans
            .filter(rp => selectedRatePlans.includes(rp.id))
            .forEach(ratePlan => {
              rows.push({ 
                type: 'ratePlan', 
                roomType, 
                ratePlan, 
                key: `rp-${roomType.id}-${ratePlan.id}` 
              });
            });
        }
      });
    
    return rows;
  }, [roomTypes, ratePlans, selectedRoomTypes, selectedRatePlans, expandedRoomTypes]);

  // Cell renderer for the virtualized grid
  const Cell = useCallback(({ rowIndex, columnIndex, style }: CellData) => {
    if (rowIndex === 0) {
      // Header row with dates
      if (columnIndex === 0) {
        return (
          <div style={style} className="flex items-center justify-center bg-background border-r border-b font-semibold">
            <Calendar className="h-4 w-4" />
          </div>
        );
      }
      
      const date = dateColumns[columnIndex - 1];
      if (!date) return <div style={style} />;
      
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      return (
        <div style={style} className={cn(
          "flex flex-col items-center justify-center bg-background border-r border-b p-1 text-xs",
          isWeekend && "bg-muted"
        )}>
          <div className="font-semibold">{format(date, 'dd')}</div>
          <div className="text-muted-foreground">{format(date, 'EEE')}</div>
        </div>
      );
    }
    
    const row = gridRows[rowIndex - 1];
    if (!row) return <div style={style} />;
    
    if (columnIndex === 0) {
      // Left column with room types and rate plans
      if (row.type === 'roomType') {
        const isExpanded = expandedRoomTypes.has(row.roomType.id);
        return (
          <div style={style} className="flex items-center bg-background border-r border-b p-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto mr-2"
              onClick={() => {
                const newExpanded = new Set(expandedRoomTypes);
                if (isExpanded) {
                  newExpanded.delete(row.roomType.id);
                } else {
                  newExpanded.add(row.roomType.id);
                }
                setExpandedRoomTypes(newExpanded);
              }}
            >
              {isExpanded ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            </Button>
            <div>
              <div className="font-semibold text-sm">{row.roomType.name}</div>
              <div className="text-xs text-muted-foreground">{row.roomType.code}</div>
            </div>
          </div>
        );
      } else {
        const ratePlan = row.ratePlan!;
        const isDerived = ratePlan.isDerived;
        
        return (
          <div style={style} className="flex items-center bg-muted/50 border-r border-b p-2 pl-8">
            <div className="flex items-center gap-2">
              {isDerived && <Link className="h-3 w-3 text-primary" />}
              <div>
                <div className="font-medium text-sm">{ratePlan.name}</div>
                <div className="text-xs text-muted-foreground">{ratePlan.code}</div>
              </div>
            </div>
          </div>
        );
      }
    }
    
    // Data cells
    if (row.type === 'roomType') {
      const date = dateColumns[columnIndex - 1];
      if (!date) return <div style={style} />;
      
      const dateStr = format(date, 'yyyy-MM-dd');
      const inventory = inventoryCalendar.find(i => 
        i.date === dateStr && i.roomTypeId === row.roomType.id
      );
      
      const available = inventory ? inventory.totalRooms - inventory.soldRooms - inventory.outOfOrderRooms : 0;
      
      return (
        <div style={style} className="flex items-center justify-center bg-card border-r border-b p-1">
          <div className="text-center">
            <div className="text-sm font-medium">{available}</div>
            <div className="text-xs text-muted-foreground">avail</div>
          </div>
        </div>
      );
    } else {
      const date = dateColumns[columnIndex - 1];
      if (!date) return <div style={style} />;
      
      const dateStr = format(date, 'yyyy-MM-dd');
      const cellKey = `ari-${dateStr}-${row.roomType.id}-${row.ratePlan!.id}`;
      const ariValue = ariValues.find(ari => ari.id === cellKey);
      const pendingChange = pendingChanges.get(cellKey);
      const effectiveValue = { ...ariValue, ...pendingChange };
      
      if (!effectiveValue) return <div style={style} className="border-r border-b" />;
      
      const isSelected = selectedCells.has(cellKey);
      const hasChanges = pendingChanges.has(cellKey);
      const isOverridden = effectiveValue.overridden;
      const isDerived = row.ratePlan!.isDerived;
      
      return (
        <div 
          style={style} 
          className={cn(
            "border-r border-b p-1 cursor-pointer transition-colors",
            isSelected && "bg-primary/20",
            hasChanges && "bg-yellow-100 dark:bg-yellow-900/20",
            isOverridden && "bg-orange-100 dark:bg-orange-900/20",
            "hover:bg-accent"
          )}
          onClick={() => {
            const newSelected = new Set(selectedCells);
            if (isSelected) {
              newSelected.delete(cellKey);
            } else {
              newSelected.add(cellKey);
            }
            setSelectedCells(newSelected);
          }}
        >
          {activeTab === 'rates' || activeTab === 'all' ? (
            <div className="text-center">
              <div className={cn(
                "text-sm font-medium",
                isDerived && !isOverridden && "text-muted-foreground"
              )}>
                €{(effectiveValue.rateCents / 100).toFixed(0)}
                {isOverridden && <span className="text-xs ml-1">⚠</span>}
              </div>
              {activeTab === 'all' && (
                <div className="text-xs space-x-1">
                  {effectiveValue.cta && <Badge variant="destructive" className="text-xs px-1">CTA</Badge>}
                  {effectiveValue.ctd && <Badge variant="destructive" className="text-xs px-1">CTD</Badge>}
                  {effectiveValue.stopSell && <Badge variant="destructive" className="text-xs px-1">SS</Badge>}
                </div>
              )}
            </div>
          ) : activeTab === 'restrictions' ? (
            <div className="text-center space-y-1">
              <div className="text-xs">
                LOS {effectiveValue.minLos}-{effectiveValue.maxLos || '∞'}
              </div>
              <div className="flex justify-center space-x-1">
                {effectiveValue.cta && <Badge variant="destructive" className="text-xs px-1">CTA</Badge>}
                {effectiveValue.ctd && <Badge variant="destructive" className="text-xs px-1">CTD</Badge>}
                {effectiveValue.stopSell && <Badge variant="destructive" className="text-xs px-1">SS</Badge>}
              </div>
            </div>
          ) : null}
        </div>
      );
    }
  }, [
    dateColumns, 
    gridRows, 
    expandedRoomTypes, 
    inventoryCalendar, 
    ariValues, 
    pendingChanges, 
    selectedCells,
    activeTab,
    ratePlans
  ]);

  // Copy selected cells
  const handleCopy = useCallback(() => {
    const data = Array.from(selectedCells).map(cellKey => {
      const ari = ariValues.find(a => a.id === cellKey);
      const pending = pendingChanges.get(cellKey);
      return { ...ari, ...pending };
    });
    setCopiedData(data);
    toast({ title: `Copied ${data.length} cells` });
  }, [selectedCells, ariValues, pendingChanges]);

  // Paste to selected cells
  const handlePaste = useCallback(() => {
    if (!copiedData || copiedData.length === 0) return;
    
    const template = copiedData[0];
    const updates = Array.from(selectedCells).map(cellKey => ({
      key: cellKey,
      updates: {
        rateCents: template.rateCents,
        minLos: template.minLos,
        maxLos: template.maxLos,
        cta: template.cta,
        ctd: template.ctd,
        stopSell: template.stopSell,
      }
    }));
    
    updates.forEach(({ key, updates }) => {
      updateARIValue(key, updates);
    });
    
    toast({ title: `Pasted to ${updates.length} cells` });
  }, [copiedData, selectedCells, updateARIValue]);

  // Bulk update handler
  const handleBulkUpdate = useCallback((updates: any) => {
    const { dateRange, roomTypeIds, ratePlanIds, changes } = updates;
    
    // Generate date array
    const dates = [];
    let currentDate = parseISO(dateRange.from);
    const endDate = parseISO(dateRange.to);
    
    while (currentDate <= endDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
    
    bulkUpdateARI({ dates, roomTypeIds, ratePlanIds, changes });
    
    addAuditEntry({
      actor: 'User',
      action: 'Bulk Update ARI',
      entityType: 'ARI',
      entityId: 'bulk',
      summary: `Updated ${dates.length} dates, ${roomTypeIds.length} room types, ${ratePlanIds.length} rate plans`,
      payload: updates,
    });
    
    toast({ title: `Bulk update applied to ${dates.length * roomTypeIds.length * ratePlanIds.length} cells` });
    setShowBulkEditor(false);
  }, [bulkUpdateARI, addAuditEntry]);

  // Publish changes
  const handlePublish = useCallback(() => {
    if (pendingChanges.size === 0) {
      toast({ title: 'No changes to publish', variant: 'destructive' });
      return;
    }
    
    // Check for missing mappings
    const missingMappings = Array.from(pendingChanges.keys()).some(key => {
      const [, , roomTypeId, ratePlanId] = key.split('-');
      return !channelMappings.find(m => m.roomTypeId === roomTypeId && m.ratePlanId === ratePlanId);
    });
    
    if (missingMappings) {
      toast({ 
        title: 'Missing channel mappings', 
        description: 'Please configure channel mappings before publishing',
        variant: 'destructive' 
      });
      return;
    }
    
    // Create publish queue items
    const publishItems = [{
      kind: 'rate' as const,
      dateFrom: selectedDateRange.from,
      dateTo: selectedDateRange.to,
      scope: { changes: Array.from(pendingChanges.entries()) },
      status: 'queued' as const,
      attempt: 0,
      idempotencyKey: `publish-${Date.now()}`,
    }];
    
    enqueuePublish(publishItems);
    clearPendingChanges();
    
    addAuditEntry({
      actor: 'User',
      action: 'Publish ARI',
      entityType: 'ARI',
      entityId: 'publish',
      summary: `Published ${pendingChanges.size} changes to mini-GDS`,
      payload: { publishItems },
    });
    
    toast({ title: `Published ${pendingChanges.size} changes to mini-GDS` });
    setShowPublishDialog(false);
  }, [pendingChanges, channelMappings, selectedDateRange, enqueuePublish, clearPendingChanges, addAuditEntry]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">ARI Calendar</h1>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList>
              <TabsTrigger value="rates">Rates</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={selectedCells.size === 0}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handlePaste} disabled={!copiedData}>
            <Clipboard className="h-4 w-4 mr-1" />
            Paste
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Sheet open={showBulkEditor} onOpenChange={setShowBulkEditor}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Bulk Edit
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <BulkEditor onApply={handleBulkUpdate} onClose={() => setShowBulkEditor(false)} />
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Publish Bar */}
      {pendingChanges.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border-b p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{pendingChanges.size} changes</Badge>
              <span className="text-sm text-muted-foreground">Ready to publish</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => clearPendingChanges()}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary">
                    <Upload className="h-4 w-4 mr-1" />
                    Review & Publish
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <PublishDialog 
                    changes={pendingChanges}
                    onPublish={handlePublish}
                    onClose={() => setShowPublishDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <Grid
          ref={gridRef}
          height={600}
          width={1200}
          columnCount={dateColumns.length + 1}
          columnWidth={100}
          rowCount={gridRows.length + 1}
          rowHeight={60}
          itemData={{ dateColumns, gridRows }}
        >
          {Cell}
        </Grid>
      </div>
    </div>
  );
};

// Bulk Editor Component
const BulkEditor: React.FC<{ onApply: (updates: any) => void; onClose: () => void }> = ({ onApply, onClose }) => {
  const { roomTypes, ratePlans, selectedDateRange } = useChannelStore();
  const [formData, setFormData] = useState({
    dateRange: selectedDateRange,
    roomTypeIds: [] as string[],
    ratePlanIds: [] as string[],
    weekdays: [true, true, true, true, true, true, true], // Sun-Sat
    rateChange: { type: 'set', value: 0 },
    availabilityChange: { type: 'set', value: 0 },
    restrictions: {
      minLos: 1,
      maxLos: 0,
      cta: false,
      ctd: false,
      stopSell: false,
    },
  });

  const handleApply = () => {
    const changes: any = {};
    
    if (formData.rateChange.value !== 0) {
      if (formData.rateChange.type === 'set') {
        changes.rateCents = formData.rateChange.value * 100;
      }
      // Add delta logic here
    }
    
    if (formData.restrictions.minLos !== 1) changes.minLos = formData.restrictions.minLos;
    if (formData.restrictions.maxLos !== 0) changes.maxLos = formData.restrictions.maxLos;
    changes.cta = formData.restrictions.cta;
    changes.ctd = formData.restrictions.ctd;
    changes.stopSell = formData.restrictions.stopSell;
    
    onApply({
      dateRange: formData.dateRange,
      roomTypeIds: formData.roomTypeIds,
      ratePlanIds: formData.ratePlanIds,
      changes,
    });
  };

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>Bulk Editor</SheetTitle>
        <SheetDescription>
          Apply changes to multiple cells at once
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4">
        <div>
          <Label>Room Types</Label>
          <div className="space-y-2 mt-2">
            {roomTypes.map(rt => (
              <div key={rt.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.roomTypeIds.includes(rt.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        roomTypeIds: [...prev.roomTypeIds, rt.id]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        roomTypeIds: prev.roomTypeIds.filter(id => id !== rt.id)
                      }));
                    }
                  }}
                />
                <span className="text-sm">{rt.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Rate Plans</Label>
          <div className="space-y-2 mt-2">
            {ratePlans.map(rp => (
              <div key={rp.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.ratePlanIds.includes(rp.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        ratePlanIds: [...prev.ratePlanIds, rp.id]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        ratePlanIds: prev.ratePlanIds.filter(id => id !== rp.id)
                      }));
                    }
                  }}
                />
                <span className="text-sm">{rp.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Rate Changes</Label>
          <div className="flex gap-2 mt-2">
            <Select
              value={formData.rateChange.type}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                rateChange: { ...prev.rateChange, type: value as 'set' | 'delta' }
              }))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="set">Set</SelectItem>
                <SelectItem value="delta">Delta</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={formData.rateChange.value}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                rateChange: { ...prev.rateChange, value: Number(e.target.value) }
              }))}
              placeholder="Rate value"
            />
          </div>
        </div>

        <div>
          <Label>Restrictions</Label>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Stop Sell</span>
              <Switch
                checked={formData.restrictions.stopSell}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  restrictions: { ...prev.restrictions, stopSell: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Closed to Arrival</span>
              <Switch
                checked={formData.restrictions.cta}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  restrictions: { ...prev.restrictions, cta: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Closed to Departure</span>
              <Switch
                checked={formData.restrictions.ctd}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  restrictions: { ...prev.restrictions, ctd: checked }
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleApply} className="bg-gradient-primary">
          Apply Changes
        </Button>
      </div>
    </div>
  );
};

// Publish Dialog Component
const PublishDialog: React.FC<{ 
  changes: Map<string, any>; 
  onPublish: () => void; 
  onClose: () => void; 
}> = ({ changes, onPublish, onClose }) => {
  const { roomTypes, ratePlans } = useChannelStore();
  
  const groupedChanges = useMemo(() => {
    const groups: any = {};
    
    Array.from(changes.entries()).forEach(([key, change]) => {
      const [, date, roomTypeId, ratePlanId] = key.split('-');
      const roomType = roomTypes.find(rt => rt.id === roomTypeId);
      const ratePlan = ratePlans.find(rp => rp.id === ratePlanId);
      
      if (!groups[date]) groups[date] = {};
      if (!groups[date][roomTypeId]) groups[date][roomTypeId] = {};
      
      groups[date][roomTypeId][ratePlanId] = {
        roomType: roomType?.name,
        ratePlan: ratePlan?.name,
        change
      };
    });
    
    return groups;
  }, [changes, roomTypes, ratePlans]);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Review & Publish Changes</DialogTitle>
        <DialogDescription>
          Review changes before publishing to mini-GDS
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-96 overflow-y-auto space-y-4">
        {Object.entries(groupedChanges).map(([date, roomTypeChanges]: [string, any]) => (
          <Card key={date}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{format(parseISO(date), 'PPP')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(roomTypeChanges).map(([roomTypeId, ratePlanChanges]: [string, any]) => (
                <div key={roomTypeId} className="space-y-1">
                  {Object.entries(ratePlanChanges).map(([ratePlanId, { roomType, ratePlan, change }]: [string, any]) => (
                    <div key={ratePlanId} className="flex justify-between items-center text-sm">
                      <span>{roomType} - {ratePlan}</span>
                      <div className="flex gap-2">
                        {change.rateCents && (
                          <Badge variant="secondary">€{(change.rateCents / 100).toFixed(0)}</Badge>
                        )}
                        {change.cta && <Badge variant="destructive">CTA</Badge>}
                        {change.ctd && <Badge variant="destructive">CTD</Badge>}
                        {change.stopSell && <Badge variant="destructive">SS</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onPublish} className="bg-gradient-primary">
          <Upload className="h-4 w-4 mr-1" />
          Publish to mini-GDS
        </Button>
      </div>
    </div>
  );
};

export default ARICalendar;