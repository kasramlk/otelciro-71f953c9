import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Upload, Check, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useChannelStore } from '@/stores/channel-store';
import { cn } from '@/lib/utils';

// Mock GDS products for selection
const mockGDSProducts = [
  { code: 'STD-001', name: 'Standard Room - BAR' },
  { code: 'STD-002', name: 'Standard Room - NR' },
  { code: 'STD-003', name: 'Standard Room - BB' },
  { code: 'DLX-001', name: 'Deluxe Room - BAR' },
  { code: 'DLX-002', name: 'Deluxe Room - NR' },
  { code: 'DLX-003', name: 'Deluxe Room - BB' },
  { code: 'TWN-001', name: 'Twin Garden - BAR' },
  { code: 'TWN-002', name: 'Twin Garden - NR' },
  { code: 'FAM-001', name: 'Family Room - BAR' },
  { code: 'STE-001', name: 'Suite Sea - BAR' },
];

const ChannelMapping: React.FC = () => {
  const {
    roomTypes,
    ratePlans,
    channelMappings,
    updateChannelMapping,
    deleteChannelMapping,
    addAuditEntry,
  } = useChannelStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  // Generate all room type + rate plan combinations
  const mappingRows = useMemo(() => {
    const rows = [];
    for (const roomType of roomTypes) {
      for (const ratePlan of ratePlans) {
        const existingMapping = channelMappings.find(
          m => m.roomTypeId === roomType.id && m.ratePlanId === ratePlan.id
        );
        
        rows.push({
          key: `${roomType.id}-${ratePlan.id}`,
          roomType,
          ratePlan,
          mapping: existingMapping,
        });
      }
    }
    return rows;
  }, [roomTypes, ratePlans, channelMappings]);

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchTerm) return mappingRows;
    
    return mappingRows.filter(row => 
      row.roomType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.ratePlan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.mapping?.gdsProductCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mappingRows, searchTerm]);

  // Handle mapping update
  const handleUpdateMapping = (roomTypeId: string, ratePlanId: string, gdsProductCode: string) => {
    updateChannelMapping(roomTypeId, ratePlanId, gdsProductCode);
    
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    const ratePlan = ratePlans.find(rp => rp.id === ratePlanId);
    
    addAuditEntry({
      actor: 'User',
      action: 'Update Channel Mapping',
      entityType: 'ChannelMapping',
      entityId: `${roomTypeId}-${ratePlanId}`,
      summary: `Mapped ${roomType?.name} - ${ratePlan?.name} to ${gdsProductCode}`,
      payload: { roomTypeId, ratePlanId, gdsProductCode },
    });
    
    toast({ title: 'Mapping updated successfully' });
  };

  // Handle mapping deletion
  const handleDeleteMapping = (roomTypeId: string, ratePlanId: string) => {
    deleteChannelMapping(roomTypeId, ratePlanId);
    
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    const ratePlan = ratePlans.find(rp => rp.id === ratePlanId);
    
    addAuditEntry({
      actor: 'User',
      action: 'Delete Channel Mapping',
      entityType: 'ChannelMapping',
      entityId: `${roomTypeId}-${ratePlanId}`,
      summary: `Removed mapping for ${roomType?.name} - ${ratePlan?.name}`,
      payload: { roomTypeId, ratePlanId },
    });
    
    toast({ title: 'Mapping deleted successfully' });
  };

  // Export mappings as CSV
  const handleExportCSV = () => {
    const csvData = [
      ['Room Type', 'Rate Plan', 'GDS Product Code', 'Status'],
      ...mappingRows.map(row => [
        row.roomType.name,
        row.ratePlan.name,
        row.mapping?.gdsProductCode || '',
        row.mapping?.isActive ? 'Active' : 'Inactive'
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'channel_mappings.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Mappings exported successfully' });
  };

  // Get mapping statistics
  const stats = useMemo(() => {
    const total = mappingRows.length;
    const mapped = mappingRows.filter(row => row.mapping).length;
    const unmapped = total - mapped;
    
    return { total, mapped, unmapped };
  }, [mappingRows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Channel Mapping</h1>
          <p className="text-muted-foreground">
            Map PMS room types and rate plans to mini-GDS product codes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Combinations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.mapped}</div>
            <p className="text-xs text-muted-foreground">Mapped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.unmapped}</div>
            <p className="text-xs text-muted-foreground">Unmapped</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search room types, rate plans, or product codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle>PMS to mini-GDS Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRows.map((row) => (
              <motion.div
                key={row.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 rounded-lg border",
                  !row.mapping && "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                )}
              >
                {/* Room Type */}
                <div className="col-span-3">
                  <div className="font-medium">{row.roomType.name}</div>
                  <div className="text-sm text-muted-foreground">{row.roomType.code}</div>
                </div>

                {/* Rate Plan */}
                <div className="col-span-3">
                  <div className="font-medium">{row.ratePlan.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {row.ratePlan.code}
                    {row.ratePlan.isDerived && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Derived
                      </Badge>
                    )}
                  </div>
                </div>

                {/* GDS Product Code */}
                <div className="col-span-4">
                  <Select
                    value={row.mapping?.gdsProductCode || ''}
                    onValueChange={(value) => {
                      if (value) {
                        handleUpdateMapping(row.roomType.id, row.ratePlan.id, value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GDS product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mockGDSProducts.map((product) => (
                        <SelectItem key={product.code} value={product.code}>
                          <div>
                            <div className="font-medium">{product.code}</div>
                            <div className="text-xs text-muted-foreground">{product.name}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {row.mapping ? (
                    <>
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Mapped
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMapping(row.roomType.id, row.ratePlan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Unmapped
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredRows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No mappings found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning for unmapped items */}
      {stats.unmapped > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <X className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                {stats.unmapped} unmapped combinations
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                Publishing ARI changes will be blocked until all required mappings are configured.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChannelMapping;