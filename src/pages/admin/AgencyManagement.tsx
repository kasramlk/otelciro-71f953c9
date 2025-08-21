import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Plus, Edit, Trash2, Building, DollarSign, Search, CreditCard } from "lucide-react";
import { auditLogger } from "@/lib/audit-logger";

interface Agency {
  id: string;
  name: string;
  type: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  credit_limit: number;
  current_balance: number;
  payment_terms: number;
  is_active: boolean;
  created_at: string;
}

interface Contract {
  id: string;
  agency_id: string;
  hotel_id: string;
  contract_name: string;
  contract_type: string;
  valid_from: string;
  valid_until: string;
  commission_rate: number;
  is_active: boolean;
  agency_name?: string;
  hotel_name?: string;
}

const AgencyManagement = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [activeTab, setActiveTab] = useState<'agencies' | 'contracts'>('agencies');
  const { toast } = useToast();

  const [newAgency, setNewAgency] = useState({
    name: '',
    type: 'OTA',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    country: '',
    credit_limit: 0,
    payment_terms: 30
  });

  const [newContract, setNewContract] = useState({
    agency_id: '',
    hotel_id: '',
    contract_name: '',
    contract_type: 'Standard',
    valid_from: '',
    valid_until: '',
    commission_rate: 10
  });

  const agencyTypes = ['OTA', 'Travel Agent', 'Tour Operator', 'Corporate', 'Other'];
  const contractTypes = ['Standard', 'Net Rate', 'Commissionable', 'Package Deal', 'Allotment'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchAgencies(),
        fetchContracts(),
        fetchHotels()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgencies(data || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('agency_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Manually enrich with agency and hotel names
      const enrichedContracts = await Promise.all(
        (data || []).map(async (contract) => {
          const [agencyData, hotelData] = await Promise.all([
            supabase.from('agencies').select('name').eq('id', contract.agency_id).single(),
            supabase.from('hotels').select('name').eq('id', contract.hotel_id).single()
          ]);
          
          return {
            ...contract,
            agency_name: agencyData.data?.name || 'Unknown Agency',
            hotel_name: hotelData.data?.name || 'Unknown Hotel'
          };
        })
      );
      
      setContracts(enrichedContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const createAgency = async () => {
    if (!newAgency.name || !newAgency.contact_email) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // First create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: newAgency.name,
          billing_email: newAgency.contact_email
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const { data, error } = await supabase
        .from('agencies')
        .insert({
          ...newAgency,
          org_id: orgData.id
        })
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await auditLogger.log({
        entity_type: 'agency',
        entity_id: data.id,
        action: 'CREATE',
        new_values: data,
        metadata: { source: 'admin_panel' }
      });

      toast({
        title: "Success",
        description: "Agency created successfully",
      });

      setShowCreateDialog(false);
      resetNewAgency();
      fetchAgencies();
    } catch (error: any) {
      console.error('Error creating agency:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create agency",
        variant: "destructive",
      });
    }
  };

  const createContract = async () => {
    if (!newContract.agency_id || !newContract.hotel_id || !newContract.contract_name) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('agency_contracts')
        .insert(newContract)
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await auditLogger.log({
        entity_type: 'contract',
        entity_id: data.id,
        action: 'CREATE',
        new_values: data,
        metadata: { source: 'admin_panel' }
      });

      toast({
        title: "Success",
        description: "Contract created successfully",
      });

      setShowContractDialog(false);
      resetNewContract();
      fetchContracts();
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create contract",
        variant: "destructive",
      });
    }
  };

  const updateAgencyStatus = async (agencyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ is_active: isActive })
        .eq('id', agencyId);

      if (error) throw error;

      // Log the update
      await auditLogger.log({
        entity_type: 'agency',
        entity_id: agencyId,
        action: 'UPDATE',
        old_values: { is_active: !isActive },
        new_values: { is_active: isActive },
        metadata: { source: 'admin_panel', field: 'status' }
      });

      setAgencies(prev => prev.map(agency => 
        agency.id === agencyId ? { ...agency, is_active: isActive } : agency
      ));

      toast({
        title: "Success",
        description: `Agency ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating agency status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update agency status",
        variant: "destructive",
      });
    }
  };

  const deleteAgency = async (agencyId: string) => {
    if (!confirm('Are you sure you want to delete this agency? This will also remove all related contracts.')) {
      return;
    }

    try {
      const agency = agencies.find(a => a.id === agencyId);
      
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', agencyId);

      if (error) throw error;

      // Log the deletion
      await auditLogger.log({
        entity_type: 'agency',
        entity_id: agencyId,
        action: 'DELETE',
        old_values: agency,
        metadata: { source: 'admin_panel' }
      });

      toast({
        title: "Success",
        description: "Agency deleted successfully",
      });

      fetchAgencies();
      fetchContracts(); // Refresh contracts as they may be affected
    } catch (error: any) {
      console.error('Error deleting agency:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete agency",
        variant: "destructive",
      });
    }
  };

  const resetNewAgency = () => {
    setNewAgency({
      name: '',
      type: 'OTA',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      city: '',
      country: '',
      credit_limit: 0,
      payment_terms: 30
    });
  };

  const resetNewContract = () => {
    setNewContract({
      agency_id: '',
      hotel_id: '',
      contract_name: '',
      contract_type: 'Standard',
      valid_from: '',
      valid_until: '',
      commission_rate: 10
    });
  };

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContracts = contracts.filter(contract =>
    (contract.agency_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contract.hotel_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Agency Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agency Management</h1>
          <p className="text-muted-foreground">Manage travel agencies and their contracts</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Agencies</p>
                <p className="text-2xl font-bold">{agencies.length}</p>
              </div>
              <Plane className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Agencies</p>
                <p className="text-2xl font-bold">{agencies.filter(a => a.is_active).length}</p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Contracts</p>
                <p className="text-2xl font-bold">{contracts.filter(c => c.is_active).length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Credit</p>
                <p className="text-2xl font-bold">
                  ${agencies.reduce((sum, a) => sum + (a.credit_limit || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'agencies' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('agencies')}
          className="px-6"
        >
          Agencies
        </Button>
        <Button
          variant={activeTab === 'contracts' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('contracts')}
          className="px-6"
        >
          Contracts
        </Button>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {activeTab === 'agencies' && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Agency
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Agency</DialogTitle>
                      <DialogDescription>Add a new travel agency to the platform</DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Agency Name *</Label>
                        <Input
                          id="name"
                          value={newAgency.name}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Travel Plus Agency"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="type">Agency Type</Label>
                        <Select value={newAgency.type} onValueChange={(value) => setNewAgency(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {agencyTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact_person">Contact Person</Label>
                        <Input
                          id="contact_person"
                          value={newAgency.contact_person}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, contact_person: e.target.value }))}
                          placeholder="John Smith"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="contact_email">Contact Email *</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={newAgency.contact_email}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="john@travelplus.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact_phone">Phone</Label>
                        <Input
                          id="contact_phone"
                          value={newAgency.contact_phone}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, contact_phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={newAgency.address}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={newAgency.city}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="New York"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={newAgency.country}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="United States"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="credit_limit">Credit Limit ($)</Label>
                        <Input
                          id="credit_limit"
                          type="number"
                          min="0"
                          value={newAgency.credit_limit}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, credit_limit: parseInt(e.target.value) || 0 }))}
                          placeholder="50000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                        <Input
                          id="payment_terms"
                          type="number"
                          min="0"
                          value={newAgency.payment_terms}
                          onChange={(e) => setNewAgency(prev => ({ ...prev, payment_terms: parseInt(e.target.value) || 30 }))}
                          placeholder="30"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => {
                        setShowCreateDialog(false);
                        resetNewAgency();
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={createAgency}>
                        Create Agency
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {activeTab === 'contracts' && (
                <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Contract</DialogTitle>
                      <DialogDescription>Set up a contract between agency and hotel</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="agency">Agency *</Label>
                        <Select value={newContract.agency_id} onValueChange={(value) => setNewContract(prev => ({ ...prev, agency_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select agency" />
                          </SelectTrigger>
                          <SelectContent>
                            {agencies.filter(a => a.is_active).map(agency => (
                              <SelectItem key={agency.id} value={agency.id}>
                                {agency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hotel">Hotel *</Label>
                        <Select value={newContract.hotel_id} onValueChange={(value) => setNewContract(prev => ({ ...prev, hotel_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hotel" />
                          </SelectTrigger>
                          <SelectContent>
                            {hotels.map(hotel => (
                              <SelectItem key={hotel.id} value={hotel.id}>
                                {hotel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contract_name">Contract Name *</Label>
                        <Input
                          id="contract_name"
                          value={newContract.contract_name}
                          onChange={(e) => setNewContract(prev => ({ ...prev, contract_name: e.target.value }))}
                          placeholder="Standard Partnership Agreement"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contract_type">Contract Type</Label>
                        <Select value={newContract.contract_type} onValueChange={(value) => setNewContract(prev => ({ ...prev, contract_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {contractTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                        <Input
                          id="commission_rate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={newContract.commission_rate}
                          onChange={(e) => setNewContract(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 10 }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="valid_from">Valid From</Label>
                          <Input
                            id="valid_from"
                            type="date"
                            value={newContract.valid_from}
                            onChange={(e) => setNewContract(prev => ({ ...prev, valid_from: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="valid_until">Valid Until</Label>
                          <Input
                            id="valid_until"
                            type="date"
                            value={newContract.valid_until}
                            onChange={(e) => setNewContract(prev => ({ ...prev, valid_until: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setShowContractDialog(false);
                        resetNewContract();
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={createContract}>
                        Create Contract
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'agencies' ? (
        <Card>
          <CardHeader>
            <CardTitle>Travel Agencies ({filteredAgencies.length})</CardTitle>
            <CardDescription>Manage agency partnerships and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{agency.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agency.city && agency.country ? `${agency.city}, ${agency.country}` : 'Location not set'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{agency.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{agency.contact_person || 'Not set'}</div>
                        <div className="text-sm text-muted-foreground">{agency.contact_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">${agency.credit_limit?.toLocaleString() || 0}</div>
                        <div className="text-sm text-muted-foreground">
                          Balance: ${agency.current_balance?.toLocaleString() || 0}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={agency.is_active}
                          onCheckedChange={(checked) => updateAgencyStatus(agency.id, checked)}
                        />
                        <span className="text-sm">
                          {agency.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAgency(agency)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAgency(agency.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Agency Contracts ({filteredContracts.length})</CardTitle>
            <CardDescription>Manage contracts between agencies and hotels</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.contract_name}</div>
                        <div className="text-sm text-muted-foreground">{contract.contract_type}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        <span>{contract.agency_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{contract.hotel_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{contract.commission_rate}%</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>From: {new Date(contract.valid_from).toLocaleDateString()}</div>
                        {contract.valid_until && (
                          <div>Until: {new Date(contract.valid_until).toLocaleDateString()}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contract.is_active ? "default" : "secondary"}>
                        {contract.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgencyManagement;