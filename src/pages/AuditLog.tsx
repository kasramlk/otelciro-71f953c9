import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  FileSearch, 
  Search, 
  Filter,
  Calendar as CalendarIcon,
  User,
  Eye,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Mock data
const mockAuditLogs = [
  {
    id: "1",
    actor: "John Manager",
    action: "CREATE",
    entityType: "Reservation",
    entityId: "RES001",
    oldValues: null,
    newValues: {
      guest: "John Doe",
      room: "101",
      checkIn: "2024-01-15",
      checkOut: "2024-01-18",
      total: 899.99,
    },
    diffJson: {
      created: ["guest", "room", "checkIn", "checkOut", "total"],
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    timestamp: new Date("2024-01-15T10:30:00"),
  },
  {
    id: "2",
    actor: "Sarah Desk",
    action: "UPDATE",
    entityType: "Guest",
    entityId: "GST001",
    oldValues: {
      phone: "+1 555 111 1111",
      email: "old@email.com",
    },
    newValues: {
      phone: "+1 555 123 4567",
      email: "john.doe@email.com",
    },
    diffJson: {
      changed: ["phone", "email"],
    },
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    timestamp: new Date("2024-01-15T14:20:00"),
  },
  {
    id: "3",
    actor: "Mike House",
    action: "UPDATE",
    entityType: "Room",
    entityId: "RM101",
    oldValues: {
      status: "Dirty",
    },
    newValues: {
      status: "Clean",
    },
    diffJson: {
      changed: ["status"],
    },
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    timestamp: new Date("2024-01-15T16:45:00"),
  },
  {
    id: "4",
    actor: "John Manager",
    action: "DELETE",
    entityType: "Reservation",
    entityId: "RES005",
    oldValues: {
      guest: "Cancelled Guest",
      room: "205",
      status: "Cancelled",
    },
    newValues: null,
    diffJson: {
      deleted: ["guest", "room", "status"],
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    timestamp: new Date("2024-01-14T09:15:00"),
  },
  {
    id: "5",
    actor: "Sarah Desk",
    action: "CREATE",
    entityType: "Guest",
    entityId: "GST002",
    oldValues: null,
    newValues: {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@email.com",
      phone: "+1 555 987 6543",
    },
    diffJson: {
      created: ["firstName", "lastName", "email", "phone"],
    },
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    timestamp: new Date("2024-01-13T11:30:00"),
  },
];

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case "CREATE":
      return "default";
    case "UPDATE":
      return "secondary";
    case "DELETE":
      return "destructive";
    default:
      return "outline";
  }
};

const getEntityTypeIcon = (entityType: string) => {
  // You could add specific icons for different entity types
  return <FileSearch className="h-4 w-4" />;
};

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = userFilter === "all" || log.actor.includes(userFilter);
    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && log.timestamp >= dateFrom;
    }
    if (dateTo) {
      matchesDate = matchesDate && log.timestamp <= dateTo;
    }
    
    return matchesSearch && matchesUser && matchesEntity && matchesAction && matchesDate;
  });

  const handleViewEntity = (entityType: string, entityId: string) => {
    // Navigate to the entity - this would be implemented based on your routing
    console.log(`Navigate to ${entityType} ${entityId}`);
  };

  const formatJsonDiff = (diffJson: any) => {
    if (!diffJson) return null;
    
    const { created, changed, deleted } = diffJson;
    
    return (
      <div className="text-xs space-y-1">
        {created && (
          <div className="text-green-600">
            <span className="font-medium">Created:</span> {created.join(", ")}
          </div>
        )}
        {changed && (
          <div className="text-blue-600">
            <span className="font-medium">Changed:</span> {changed.join(", ")}
          </div>
        )}
        {deleted && (
          <div className="text-red-600">
            <span className="font-medium">Deleted:</span> {deleted.join(", ")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <FileSearch className="mr-2 h-8 w-8" />
          Audit Log
        </h2>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit log entries by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="John Manager">John Manager</SelectItem>
                <SelectItem value="Sarah Desk">Sarah Desk</SelectItem>
                <SelectItem value="Mike House">Mike House</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="Reservation">Reservation</SelectItem>
                <SelectItem value="Guest">Guest</SelectItem>
                <SelectItem value="Room">Room</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM dd") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM dd") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {filteredLogs.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{format(log.timestamp, "MMM dd, yyyy")}</div>
                            <div className="text-xs text-muted-foreground">{format(log.timestamp, "HH:mm:ss")}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{log.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getEntityTypeIcon(log.entityType)}
                          <span className="ml-2">{log.entityType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.entityId}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {formatJsonDiff(log.diffJson)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.ipAddress}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewEntity(log.entityType, log.entityId)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}