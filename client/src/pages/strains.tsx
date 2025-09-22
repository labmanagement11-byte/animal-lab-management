import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Dna } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Strain {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: Date;
}

export default function StrainsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrain, setEditingStrain] = useState<Strain | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });
  const { toast } = useToast();

  // Fetch strains
  const { data: strains, isLoading } = useQuery<Strain[]>({
    queryKey: ['/api/strains'],
  });

  // Create strain mutation
  const createStrainMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest('POST', '/api/strains', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains'] });
      toast({
        title: "Success",
        description: "Strain created successfully.",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create strain.",
        variant: "destructive",
      });
    },
  });

  // Update strain mutation
  const updateStrainMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      apiRequest('PUT', `/api/strains/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains'] });
      toast({
        title: "Success",
        description: "Strain updated successfully.",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update strain.",
        variant: "destructive",
      });
    },
  });

  // Delete strain mutation
  const deleteStrainMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/strains/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains'] });
      toast({
        title: "Success",
        description: "Strain deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete strain.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Strain name is required.",
        variant: "destructive",
      });
      return;
    }

    if (editingStrain) {
      updateStrainMutation.mutate({ id: editingStrain.id, data: formData });
    } else {
      createStrainMutation.mutate(formData);
    }
  };

  const handleEdit = (strain: Strain) => {
    setEditingStrain(strain);
    setFormData({
      name: strain.name,
      description: strain.description || "",
      category: strain.category || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this strain?")) {
      deleteStrainMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStrain(null);
    setFormData({ name: "", description: "", category: "" });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Dna className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Strain Management</h1>
            <p className="text-muted-foreground">Manage laboratory animal strains</p>
          </div>
        </div>
        <div className="text-center py-8">Loading strains...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Dna className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Strain Management</h1>
            <p className="text-muted-foreground">Manage laboratory animal strains</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-strain">
              <Plus className="w-4 h-4 mr-2" />
              Add Strain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStrain ? "Edit Strain" : "Add New Strain"}
              </DialogTitle>
              <DialogDescription>
                {editingStrain 
                  ? "Update the strain information below." 
                  : "Enter the details for the new strain."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Strain Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., C57BL/6J"
                    data-testid="input-strain-name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Inbred, Outbred, Transgenic"
                    data-testid="input-strain-category"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the strain"
                    data-testid="input-strain-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createStrainMutation.isPending || updateStrainMutation.isPending}
                  data-testid="button-save-strain"
                >
                  {createStrainMutation.isPending || updateStrainMutation.isPending
                    ? "Saving..." 
                    : editingStrain ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="w-5 h-5" />
            Strain Summary
          </CardTitle>
          <CardDescription>
            Overview of registered strains in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-total-strains">
                {strains?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Strains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500" data-testid="text-active-strains">
                {strains?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Strains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500" data-testid="text-strain-categories">
                {new Set(strains?.map(s => s.category).filter(Boolean)).size || 0}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strains Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Strains</CardTitle>
          <CardDescription>
            Complete list of registered strains
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!strains || strains.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-strains">
              <Dna className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No strains found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first strain
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-strain">
                <Plus className="w-4 h-4 mr-2" />
                Add First Strain
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strains.map((strain) => (
                  <TableRow key={strain.id} data-testid={`strain-row-${strain.id}`}>
                    <TableCell className="font-medium" data-testid={`strain-name-${strain.id}`}>
                      {strain.name}
                    </TableCell>
                    <TableCell data-testid={`strain-category-${strain.id}`}>
                      {strain.category || "—"}
                    </TableCell>
                    <TableCell data-testid={`strain-description-${strain.id}`}>
                      {strain.description || "—"}
                    </TableCell>
                    <TableCell data-testid={`strain-created-${strain.id}`}>
                      {new Date(strain.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(strain)}
                          data-testid={`button-edit-strain-${strain.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(strain.id)}
                          disabled={deleteStrainMutation.isPending}
                          data-testid={`button-delete-strain-${strain.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}