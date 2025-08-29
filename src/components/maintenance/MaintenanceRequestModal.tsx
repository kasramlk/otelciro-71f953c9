import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, AlertTriangle, Calendar, DollarSign, User, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceRequestModalProps {
  open: boolean;
  onClose: () => void;
  roomNumber?: string;
  onSubmit?: (requestData: any) => void;
}

export function MaintenanceRequestModal({
  open,
  onClose,
  roomNumber = '',
  onSubmit
}: MaintenanceRequestModalProps) {
  const [formData, setFormData] = useState({
    roomNumber: roomNumber,
    requestType: '',
    priority: 'medium',
    title: '',
    description: '',
    reportedBy: '',
    estimatedCost: '',
    urgentRepair: false,
    affectsBooking: false,
    scheduledDate: '',
    images: [] as File[]
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const requestTypes = [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Appliance Repair',
    'Furniture',
    'Bathroom',
    'General Maintenance',
    'Safety Issue',
    'Cleaning',
    'Other'
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5) // Max 5 images
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.roomNumber || !formData.requestType || !formData.title) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const requestData = {
        ...formData,
        id: `MR-${Date.now()}`,
        status: 'Open',
        createdAt: new Date().toISOString(),
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : 0
      };

      onSubmit?.(requestData);
      
      toast({
        title: "Maintenance Request Created",
        description: `Request ${requestData.id} has been submitted successfully.`,
      });
      
      onClose();
      // Reset form
      setFormData({
        roomNumber: '',
        requestType: '',
        priority: 'medium',
        title: '',
        description: '',
        reportedBy: '',
        estimatedCost: '',
        urgentRepair: false,
        affectsBooking: false,
        scheduledDate: '',
        images: []
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create maintenance request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'low': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'medium': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      'high': 'bg-red-500/10 text-red-700 border-red-500/20',
      'urgent': 'bg-red-700/20 text-red-800 border-red-700/30',
    };
    return variants[priority as keyof typeof variants] || variants.medium;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Create Maintenance Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room-number">Room Number *</Label>
                  <Input
                    id="room-number"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    placeholder="e.g., 101"
                  />
                </div>
                <div>
                  <Label htmlFor="request-type">Request Type *</Label>
                  <Select value={formData.requestType} onValueChange={(value) => setFormData({...formData, requestType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {requestTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Provide detailed information about the maintenance issue..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Priority and Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Priority & Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Badge className={getPriorityBadge(formData.priority)}>
                    {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="urgent-repair"
                    checked={formData.urgentRepair}
                    onChange={(e) => setFormData({...formData, urgentRepair: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="urgent-repair" className="text-sm">
                    Requires urgent repair
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="affects-booking"
                    checked={formData.affectsBooking}
                    onChange={(e) => setFormData({...formData, affectsBooking: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="affects-booking" className="text-sm">
                    Affects guest booking
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reported-by">Reported By</Label>
                  <Input
                    id="reported-by"
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({...formData, reportedBy: e.target.value})}
                    placeholder="Staff member name"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated-cost">Estimated Cost ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="estimated-cost"
                      type="number"
                      step="0.01"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({...formData, estimatedCost: e.target.value})}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="scheduled-date">Preferred Schedule Date</Label>
                <Input
                  id="scheduled-date"
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                />
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="images">Attach Images (Max 5)</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={formData.images.length >= 5}
                />
                {formData.images.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.images.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Summary */}
          {formData.title && formData.requestType && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-lg bg-primary/5"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Request Summary</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.requestType} issue in Room {formData.roomNumber}: {formData.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getPriorityBadge(formData.priority)}>
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                    </Badge>
                    {formData.urgentRepair && (
                      <Badge variant="destructive">Urgent</Badge>
                    )}
                    {formData.affectsBooking && (
                      <Badge variant="outline">Affects Booking</Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.roomNumber || !formData.requestType || !formData.title || loading}
          >
            {loading ? 'Creating Request...' : 'Create Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}