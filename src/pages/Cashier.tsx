import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  DollarSign, 
  Banknote,
  Building,
  Calendar,
  Clock,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Mock data
const mockCashierSession = {
  id: "1",
  sessionDate: new Date(),
  openedAt: new Date("2024-01-15T08:00:00"),
  closedAt: null,
  openingBalance: 500.00,
  closingBalance: null as number | null,
  cashCollected: 1250.75,
  cardCollected: 2840.50,
  otherCollected: 450.00,
  isClosed: false,
  user: "John Cashier",
};

const mockTransactions = [
  {
    id: "1",
    type: "Cash",
    description: "Room payment - RES001",
    amount: 299.99,
    reservation: "RES001",
    guest: "John Doe",
    timestamp: new Date("2024-01-15T10:30:00"),
  },
  {
    id: "2",
    type: "CreditCard", 
    description: "Room payment - RES002",
    amount: 450.00,
    reservation: "RES002",
    guest: "Jane Smith",
    timestamp: new Date("2024-01-15T11:15:00"),
  },
  {
    id: "3",
    type: "Cash",
    description: "Extra services - RES001",
    amount: 75.50,
    reservation: "RES001",
    guest: "John Doe",
    timestamp: new Date("2024-01-15T14:20:00"),
  },
  {
    id: "4",
    type: "OTA",
    description: "Booking.com settlement",
    amount: 325.00,
    reservation: "RES003",
    guest: "Bob Johnson",
    timestamp: new Date("2024-01-15T16:45:00"),
  },
  {
    id: "5",
    type: "Deposit",
    description: "Security deposit - RES004",
    amount: 100.00,
    reservation: "RES004",
    guest: "Alice Wilson",
    timestamp: new Date("2024-01-15T17:30:00"),
  },
];

const getPaymentTypeIcon = (type: string) => {
  switch (type) {
    case "Cash":
      return <Banknote className="h-4 w-4 text-green-600" />;
    case "CreditCard":
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case "OTA":
      return <Building className="h-4 w-4 text-purple-600" />;
    case "Deposit":
      return <DollarSign className="h-4 w-4 text-orange-600" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

const getPaymentTypeBadge = (type: string) => {
  switch (type) {
    case "Cash":
      return "bg-green-100 text-green-800";
    case "CreditCard":
      return "bg-blue-100 text-blue-800";
    case "OTA":
      return "bg-purple-100 text-purple-800";
    case "Deposit":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Cashier() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [session, setSession] = useState(mockCashierSession);
  const { toast } = useToast();

  const groupedTransactions = mockTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.type]) {
      acc[transaction.type] = [];
    }
    acc[transaction.type].push(transaction);
    return acc;
  }, {} as Record<string, typeof mockTransactions>);

  const totalsByType = Object.keys(groupedTransactions).reduce((acc, type) => {
    acc[type] = groupedTransactions[type].reduce((sum, t) => sum + t.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = Object.values(totalsByType).reduce((sum, amount) => sum + amount, 0);

  const handleOpenShift = () => {
    setSession(prev => ({
      ...prev,
      openedAt: new Date(),
      isClosed: false,
    }));
    toast({
      title: "Shift opened",
      description: "Cashier shift has been opened for today.",
    });
  };

  const handleCloseShift = () => {
    setSession(prev => ({
      ...prev,
      closedAt: new Date(),
      closingBalance: grandTotal + prev.openingBalance,
      isClosed: true,
    }));
    setIsCloseShiftOpen(false);
    toast({
      title: "Shift closed",
      description: "Cashier shift has been closed successfully.",
    });
  };

  const expectedBalance = session.openingBalance + grandTotal;
  const variance = session.closingBalance ? session.closingBalance - expectedBalance : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <CreditCard className="mr-2 h-8 w-8" />
          Cashier
        </h2>
        <div className="flex items-center space-x-2">
          {!session.isClosed ? (
            <Dialog open={isCloseShiftOpen} onOpenChange={setIsCloseShiftOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Clock className="mr-2 h-4 w-4" />
                  Close Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close Cashier Shift</DialogTitle>
                  <DialogDescription>
                    Review the daily totals and close your cashier shift.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Opening Balance</p>
                      <p className="text-lg">${session.openingBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Collected</p>
                      <p className="text-lg">${grandTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Expected Balance</p>
                      <p className="text-lg font-semibold">${expectedBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Variance</p>
                      <p className={`text-lg ${variance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(variance).toFixed(2)} {variance < 0 ? '(Short)' : variance > 0 ? '(Over)' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCloseShiftOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCloseShift}>
                    Close Shift
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={handleOpenShift}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Open New Shift
            </Button>
          )}
        </div>
      </div>

      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Shift Status - {session.user}
            </span>
            <Badge variant={session.isClosed ? "secondary" : "default"}>
              {session.isClosed ? "Closed" : "Active"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Session opened at {format(session.openedAt, "HH:mm")} on {format(session.sessionDate, "MMM dd, yyyy")}
            {session.closedAt && ` • Closed at ${format(session.closedAt, "HH:mm")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">${session.openingBalance.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Opening Balance</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">${(totalsByType.Cash || 0).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Cash Collected</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">${(totalsByType.CreditCard || 0).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Card Collected</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">${((totalsByType.OTA || 0) + (totalsByType.Deposit || 0)).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Other Collected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(totalsByType).map(([type, total]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                {getPaymentTypeIcon(type)}
                <span className="ml-2">{type}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${total.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {groupedTransactions[type]?.length || 0} transactions
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Transaction Details
          </CardTitle>
          <CardDescription>
            All transactions for the current session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Cash">Cash</TabsTrigger>
              <TabsTrigger value="CreditCard">Credit Card</TabsTrigger>
              <TabsTrigger value="OTA">OTA</TabsTrigger>
              <TabsTrigger value="Deposit">Deposit</TabsTrigger>
            </TabsList>
            
            {["all", ...Object.keys(groupedTransactions)].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Reservation</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tabValue === "all" ? mockTransactions : groupedTransactions[tabValue] || [])
                      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              {format(transaction.timestamp, "HH:mm")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getPaymentTypeIcon(transaction.type)}
                              <Badge className={getPaymentTypeBadge(transaction.type)}>
                                {transaction.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.guest}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.reservation}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${transaction.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Balance Summary */}
      {session.isClosed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Final Balance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">${expectedBalance.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Expected Balance</p>
              </div>
              <div>
                <p className="text-2xl font-bold">${session.closingBalance?.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Actual Balance</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${variance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(variance).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {variance === 0 ? "Balanced" : variance < 0 ? "Short" : "Over"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}