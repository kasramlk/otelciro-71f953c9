import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Calendar, Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Checkbox } from '@/components/ui/checkbox';

interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'multiSelect' | 'dateRange' | 'text' | 'number' | 'checkbox';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterState {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  className?: string;
  title?: string;
}

export const AdvancedFilters = ({
  filters,
  onFiltersChange,
  onReset,
  className = '',
  title = 'Advanced Filters'
}: AdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({});
  const [quickSearch, setQuickSearch] = useState('');

  const activeFiltersCount = Object.keys(filterState).filter(
    key => filterState[key] !== undefined && filterState[key] !== '' && filterState[key] !== null
  ).length;

  const handleFilterChange = (key: string, value: any) => {
    const newState = { ...filterState, [key]: value };
    setFilterState(newState);
    onFiltersChange(newState);
  };

  const handleReset = () => {
    setFilterState({});
    setQuickSearch('');
    onReset();
  };

  const handleQuickSearch = (value: string) => {
    setQuickSearch(value);
    // Trigger search in parent component
    onFiltersChange({ ...filterState, quickSearch: value });
  };

  const renderFilterInput = (filter: FilterOption) => {
    const value = filterState[filter.key];

    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => handleFilterChange(filter.key, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiSelect':
        const selectedValues = value || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((val: string) => (
                <Badge
                  key={val}
                  variant="secondary"
                  className="text-xs"
                >
                  {filter.options?.find(opt => opt.value === val)?.label || val}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1"
                    onClick={() => {
                      const newValues = selectedValues.filter((v: string) => v !== val);
                      handleFilterChange(filter.key, newValues);
                    }}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Select
              value=""
              onValueChange={(val) => {
                if (!selectedValues.includes(val)) {
                  handleFilterChange(filter.key, [...selectedValues, val]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder || `Add ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.filter(opt => !selectedValues.includes(opt.value)).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'dateRange':
        return (
          <DateRangePicker
            date={value}
            onDateChange={(date) => handleFilterChange(filter.key, date)}
          />
        );

      case 'text':
        return (
          <Input
            type="text"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.key}
              checked={value || false}
              onCheckedChange={(checked) => handleFilterChange(filter.key, checked)}
            />
            <Label htmlFor={filter.key} className="text-sm font-normal">
              {filter.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {/* Quick Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Quick search..."
            value={quickSearch}
            onChange={(e) => handleQuickSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Reset Filters */}
        {(activeFiltersCount > 0 || quickSearch) && (
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    {title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filters.map((filter, index) => (
                    <div key={filter.key}>
                      <Label className="text-sm font-medium mb-2 block">
                        {filter.label}
                      </Label>
                      {renderFilterInput(filter)}
                      {index < filters.length - 1 && index % 3 === 2 && (
                        <Separator className="col-span-full mt-4" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Active Filters Summary */}
                {activeFiltersCount > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Active Filters:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(filterState)
                        .filter(([_, value]) => value !== undefined && value !== '' && value !== null)
                        .map(([key, value]) => {
                          const filter = filters.find(f => f.key === key);
                          if (!filter) return null;
                          
                          let displayValue = value;
                          if (filter.type === 'select' || filter.type === 'multiSelect') {
                            if (Array.isArray(value)) {
                              displayValue = value.map(v => 
                                filter.options?.find(opt => opt.value === v)?.label || v
                              ).join(', ');
                            } else {
                              displayValue = filter.options?.find(opt => opt.value === value)?.label || value;
                            }
                          }

                          return (
                            <Badge key={key} variant="secondary" className="flex items-center gap-1">
                              <span className="font-medium">{filter.label}:</span>
                              <span>{displayValue}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1"
                                onClick={() => handleFilterChange(key, null)}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </Badge>
                          );
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};