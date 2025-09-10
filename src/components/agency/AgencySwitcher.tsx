import { useState } from "react";
import { Check, ChevronsUpDown, Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAgencyAuth } from "@/hooks/use-agency-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const AgencySwitcher = () => {
  const [open, setOpen] = useState(false);
  const [showNewAgencyDialog, setShowNewAgencyDialog] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState("");
  const { currentAgency, userAgencies, switchAgency, createAgency } = useAgencyAuth();
  const { toast } = useToast();

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAgency({
        name: newAgencyName,
        type: "OTA",
      });
      toast({
        title: "Agency created",
        description: "Your new agency has been created successfully.",
      });
      setNewAgencyName("");
      setShowNewAgencyDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agency. Please try again.",
        variant: "destructive",
      });
    }
  };

  const agencies = userAgencies.map(au => ({
    id: au.agency_id,
    name: (au as any).agency?.name || `Agency ${au.agency_id.slice(0, 8)}`,
    role: au.role,
  }));

  return (
    <Dialog open={showNewAgencyDialog} onOpenChange={setShowNewAgencyDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-64 justify-between"
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="truncate">
                {currentAgency?.name || "Select agency..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search agencies..." />
            <CommandList>
              <CommandEmpty>No agency found.</CommandEmpty>
              <CommandGroup>
                {agencies.map((agency) => (
                  <CommandItem
                    key={agency.id}
                    value={agency.id}
                    onSelect={() => {
                      switchAgency(agency.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{agency.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{agency.role}</p>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          currentAgency?.id === agency.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewAgencyDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Agency
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Agency</DialogTitle>
          <DialogDescription>
            Create a new travel agency to manage your bookings and partnerships.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateAgency} className="space-y-4">
          <div>
            <Label htmlFor="agencyName">Agency Name</Label>
            <Input
              id="agencyName"
              value={newAgencyName}
              onChange={(e) => setNewAgencyName(e.target.value)}
              placeholder="Enter agency name"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowNewAgencyDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newAgencyName.trim()}>
              Create Agency
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};