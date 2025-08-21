import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Download, Mail, DollarSign } from "lucide-react";

interface DigitalInvoicingProps {
  onBack: () => void;
}

const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    guestName: "John Smith",
    roomNumber: "301",
    totalAmount: 450.00,
    currency: "USD",
    status: "Sent",
    invoiceDate: new Date(),
    items: [
      { description: "Room Charge - 3 nights", amount: 390.00 },
      { description: "Breakfast", amount: 45.00 },
      { description: "Tax", amount: 15.00 }
    ]
  }
];

export default function DigitalInvoicing({ onBack }: DigitalInvoicingProps) {
  const { toast } = useToast();

  const generateInvoice = () => {
    toast({
      title: "Invoice generated",
      description: "Digital invoice has been created and sent to guest email.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Digital Invoicing</h1>
          <p className="text-muted-foreground">Generate and manage e-invoices</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockInvoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{invoice.invoiceNumber}</span>
                <Badge variant="secondary">{invoice.status}</Badge>
              </CardTitle>
              <CardDescription>
                {invoice.guestName} - Room {invoice.roomNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-semibold">${invoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Invoice</CardTitle>
          <CardDescription>Create e-invoice for guest folio</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}