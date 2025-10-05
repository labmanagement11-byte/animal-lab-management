import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Dna, Trash2, ChevronRight } from "lucide-react";
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
  const [, setLocation] = useLocation();
  const [strainInput, setStrainInput] = useState("");
  const { toast } = useToast();

  // Fetch strains
  const { data: strains, isLoading } = useQuery<Strain[]>({
    queryKey: ['/api/strains'],
  });

  // Create strain mutation
  const createStrainMutation = useMutation({
    mutationFn: (name: string) => apiRequest('POST', '/api/strains', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strains'] });
      toast({
        title: "Success",
        description: "Strain saved successfully.",
      });
      setStrainInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save strain.",
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
        description: "Strain moved to trash. It will be permanently deleted in 10 days.",
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
    if (!strainInput.trim()) {
      toast({
        title: "Error",
        description: "Strain name is required.",
        variant: "destructive",
      });
      return;
    }

    createStrainMutation.mutate(strainInput.trim());
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this strain? It will be moved to trash and can be recovered within 10 days.")) {
      deleteStrainMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 ml-[122px] mr-[122px]">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Strain Management</h2>
          <p className="text-muted-foreground mt-1">Add and manage laboratory animal strains</p>
        </div>
      </div>

      {/* Add Strain Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Strain
          </CardTitle>
          <CardDescription>
            Enter a strain name to add it to your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="strain-name" className="sr-only">Strain Name</Label>
              <Input
                id="strain-name"
                placeholder="Enter strain name (e.g., C57BL/6J)"
                value={strainInput}
                onChange={(e) => setStrainInput(e.target.value)}
                data-testid="input-strain-name"
                disabled={createStrainMutation.isPending}
              />
            </div>
            <Button 
              type="submit" 
              disabled={createStrainMutation.isPending || !strainInput.trim()}
              data-testid="button-save-strain"
            >
              {createStrainMutation.isPending ? "Saving..." : "Save Strain"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="w-5 h-5" />
            Strain Summary
          </CardTitle>
          <CardDescription>
            Overview of saved strains in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-total-strains">
                {strains?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Strains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500" data-testid="text-recent-strains">
                {strains?.filter(s => {
                  const createdDate = new Date(s.createdAt);
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                  return createdDate > oneWeekAgo;
                }).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Added This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Strains List */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Strains</CardTitle>
          <CardDescription>
            List of all strains you've added to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading strains...</p>
            </div>
          ) : !strains || strains.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-strains">
              <Dna className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No strains saved yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first strain using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {strains.map((strain) => (
                <div
                  key={strain.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  data-testid={`strain-item-${strain.id}`}
                  onClick={() => setLocation(`/strains/${strain.id}`)}
                >
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2" data-testid={`strain-name-${strain.id}`}>
                      {strain.name}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Added {new Date(strain.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(strain.id);
                    }}
                    disabled={deleteStrainMutation.isPending}
                    data-testid={`button-delete-strain-${strain.id}`}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}