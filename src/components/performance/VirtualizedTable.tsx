// Virtualized Table Component for Large Datasets
import { useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion } from 'framer-motion';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow as UITableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce, useVirtualScroll } from '@/hooks/use-performance';
import { useProductionData } from '@/hooks/use-production-data';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export interface ColumnDefinition<T> {
  key: keyof T;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  height?: number;
  itemHeight?: number;
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  onRowClick?: (row: T, index: number) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

interface RowProps<T> {
  index: number;
  style: React.CSSProperties;
  data: {
    items: T[];
    columns: ColumnDefinition<T>[];
    onRowClick?: (row: T, index: number) => void;
  };
}

function TableRow<T>({ index, style, data }: RowProps<T>) {
  const { items, columns, onRowClick } = data;
  const row = items[index];

  return (
    <div style={style}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`grid gap-4 p-4 border-b hover:bg-accent/50 cursor-pointer transition-colors ${
          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
        }`}
        style={{
          gridTemplateColumns: columns.map(col => `${col.width || 1}fr`).join(' ')
        }}
        onClick={() => onRowClick?.(row, index)}
      >
        {columns.map((column) => (
          <div key={String(column.key)} className="flex items-center">
            {column.render 
              ? column.render(row[column.key], row, index)
              : <span className="truncate">{String(row[column.key] || '')}</span>
            }
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function VirtualizedTable<T>({
  data,
  columns,
  height = 400,
  itemHeight = 60,
  loading = false,
  searchable = true,
  filterable = true,
  sortable = true,
  onRowClick,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found"
}: VirtualizedTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (debouncedSearchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row as Record<string, any>).some(value =>
          String(value || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row =>
          String(row[key as keyof T]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, debouncedSearchTerm, filters, sortConfig]);

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const handleFilter = useCallback((key: string, value: string) => {
    setFilters(current => ({
      ...current,
      [key]: value
    }));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {processedData.length} of {data.length} rows
          </Badge>
          {filterable && (
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className="border rounded-lg">
        <div
          className="grid gap-4 p-4 border-b bg-muted/50 font-medium"
          style={{
            gridTemplateColumns: columns.map(col => `${col.width || 1}fr`).join(' ')
          }}
        >
          {columns.map((column) => (
            <div key={String(column.key)} className="flex items-center gap-2">
              <span>{column.title}</span>
              {sortable && column.sortable !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => handleSort(column.key)}
                >
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Virtualized Table Body */}
        {processedData.length > 0 ? (
          <List
            height={height}
            itemCount={processedData.length}
            itemSize={itemHeight}
            itemData={{
              items: processedData,
              columns,
              onRowClick
            }}
          >
            {TableRow}
          </List>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <div className="mb-4">
              <Search className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-lg font-medium">{emptyMessage}</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Usage example component
export function ReservationsVirtualTable() {
  const { reservations, loading } = useProductionData();

  const columns: ColumnDefinition<any>[] = [
    {
      key: 'code',
      title: 'Reservation',
      width: 1,
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'guest_name',
      title: 'Guest',
      width: 2,
      render: (value, row) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      )
    },
    {
      key: 'check_in',
      title: 'Check-in',
      width: 1,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'check_out',
      title: 'Check-out',
      width: 1,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      title: 'Status',
      width: 1,
      render: (value) => (
        <Badge variant={value === 'confirmed' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'total_amount',
      title: 'Amount',
      width: 1,
      render: (value) => `$${value?.toFixed(2) || '0.00'}`
    }
  ];

  return (
    <VirtualizedTable
      data={reservations || []}
      columns={columns}
      loading={loading}
      height={500}
      itemHeight={80}
      searchPlaceholder="Search reservations..."
      emptyMessage="No reservations found"
    />
  );
}