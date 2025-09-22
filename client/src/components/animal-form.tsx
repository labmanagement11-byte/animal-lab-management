import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Animal, Cage, User, Strain, Genotype } from "@shared/schema";

const animalFormSchema = z.object({
  animalNumber: z.string()
    .min(1, "Animal number is required")
    .regex(/^[A-Za-z0-9-]+$/i, "Animal number should contain only letters, numbers, and hyphens (e.g., M-001, F-123)")
    .transform(val => val.trim().toUpperCase()),
  cageId: z.string().optional(),
  breed: z.string().min(1, "Please select a strain from the dropdown"),
  genotype: z.string().optional(),
  status: z.enum(["Active", "Reserved", "Transferred", "Sacrificed", "Breeding", "Replaced"]).default("Active"),
  dateOfBirth: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const today = new Date();
    return date <= today;
  }, "Date of birth cannot be in the future"),
  weight: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    const weight = parseFloat(val);
    return !isNaN(weight) && weight > 0 && weight <= 1000;
  }, "Weight must be a positive number up to 1000 grams").transform(val => val && val.trim() !== '' ? val.trim() : undefined),
  gender: z.enum(["Male", "Female"]).optional(),
  color: z.string().optional(),
  generation: z.string().optional().refine((val) => {
    if (!val) return true;
    const gen = parseInt(val);
    return !isNaN(gen) && gen >= 0 && gen <= 20;
  }, "Generation must be a number between 0 and 20"),
  protocol: z.string().optional(),
  breedingStartDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const today = new Date();
    return date <= today;
  }, "Breeding start date cannot be in the future"),
  dateOfGenotyping: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const today = new Date();
    return date <= today;
  }, "Genotyping date cannot be in the future"),
  genotypingUserId: z.string().optional(),
  probes: z.boolean().default(false),
  healthStatus: z.enum(["Healthy", "Monitoring", "Sick", "Quarantine"]).default("Healthy"),
  diseases: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.status === "Breeding" && !data.breedingStartDate) {
    return false;
  }
  return true;
}, {
  message: "Breeding start date is required when status is set to 'Breeding'",
  path: ["breedingStartDate"]
});

type AnimalFormData = z.infer<typeof animalFormSchema>;

interface AnimalFormProps {
  animal?: Animal | null;
  onClose: () => void;
}

export default function AnimalForm({ animal, onClose }: AnimalFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cages } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: strains } = useQuery<Strain[]>({
    queryKey: ['/api/strains'],
  });

  const { data: genotypes } = useQuery<Genotype[]>({
    queryKey: ['/api/genotypes'],
  });

  const form = useForm<AnimalFormData>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      animalNumber: animal?.animalNumber || "",
      cageId: animal?.cageId || "none",
      breed: animal?.breed || "",
      genotype: animal?.genotype || "",
      dateOfBirth: animal?.dateOfBirth ? new Date(animal.dateOfBirth).toISOString().split('T')[0] : "",
      weight: animal?.weight || "",
      gender: animal?.gender || undefined,
      color: animal?.color || "",
      generation: animal?.generation?.toString() || "",
      protocol: animal?.protocol || "",
      breedingStartDate: animal?.breedingStartDate ? new Date(animal.breedingStartDate).toISOString().split('T')[0] : "",
      dateOfGenotyping: animal?.dateOfGenotyping ? new Date(animal.dateOfGenotyping).toISOString().split('T')[0] : "",
      genotypingUserId: animal?.genotypingUserId || "none",
      probes: animal?.probes || false,
      healthStatus: animal?.healthStatus || "Healthy",
      status: animal?.status || "Active",
      diseases: animal?.diseases || "",
      notes: animal?.notes || "",
    },
  });

  const createAnimalMutation = useMutation({
    mutationFn: async (data: AnimalFormData) => {
      const payload = {
        ...data,
        cageId: data.cageId === "none" ? undefined : data.cageId,
        weight: data.weight || undefined,
        generation: data.generation ? parseInt(data.generation) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        breedingStartDate: data.breedingStartDate ? new Date(data.breedingStartDate).toISOString() : undefined,
        dateOfGenotyping: data.dateOfGenotyping ? new Date(data.dateOfGenotyping).toISOString() : undefined,
        genotypingUserId: data.genotypingUserId === "none" ? undefined : data.genotypingUserId,
      };
      await apiRequest("POST", "/api/animals", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/animals';
        }
      });
      toast({
        title: "Success",
        description: "Animal created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create animal",
        variant: "destructive",
      });
    },
  });

  const updateAnimalMutation = useMutation({
    mutationFn: async (data: AnimalFormData) => {
      const payload = {
        ...data,
        cageId: data.cageId === "none" ? undefined : data.cageId,
        weight: data.weight || undefined,
        generation: data.generation ? parseInt(data.generation) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        breedingStartDate: data.breedingStartDate ? new Date(data.breedingStartDate).toISOString() : undefined,
        dateOfGenotyping: data.dateOfGenotyping ? new Date(data.dateOfGenotyping).toISOString() : undefined,
        genotypingUserId: data.genotypingUserId === "none" ? undefined : data.genotypingUserId,
      };
      await apiRequest("PUT", `/api/animals/${animal!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/animals';
        }
      });
      toast({
        title: "Success",
        description: "Animal updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update animal",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AnimalFormData) => {
    if (animal) {
      updateAnimalMutation.mutate(data);
    } else {
      createAnimalMutation.mutate(data);
    }
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{animal ? 'Edit Animal' : 'Add New Animal'}</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4 max-h-[80vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="animalNumber">Animal Number *</Label>
              <Input
                id="animalNumber"
                placeholder="M-001, F-123, etc."
                {...form.register("animalNumber")}
                data-testid="input-animal-number"
              />
              {form.formState.errors.animalNumber && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.animalNumber.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Use format like M-001, F-123 (letters, numbers, hyphens only)
              </p>
            </div>

            <div>
              <Label htmlFor="cageId">Cage</Label>
              <Select 
                value={form.watch("cageId")} 
                onValueChange={(value) => form.setValue("cageId", value)}
              >
                <SelectTrigger data-testid="select-cage">
                  <SelectValue placeholder="Select cage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No cage assigned</SelectItem>
                  {cages?.map((cage) => (
                    <SelectItem key={cage.id} value={cage.id}>
                      {cage.cageNumber} - {cage.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="breed">Strain *</Label>
              <Select
                value={form.watch("breed")}
                onValueChange={(value) => form.setValue("breed", value)}
              >
                <SelectTrigger data-testid="select-strain">
                  <SelectValue placeholder="Select strain" />
                </SelectTrigger>
                <SelectContent>
                  {strains?.map((strain) => (
                    <SelectItem key={strain.id} value={strain.name}>
                      {strain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.breed && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.breed.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="genotype">Genotype</Label>
              <Select
                value={form.watch("genotype") || ""}
                onValueChange={(value) => form.setValue("genotype", value)}
              >
                <SelectTrigger data-testid="select-genotype">
                  <SelectValue placeholder="Select genotype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No genotype</SelectItem>
                  {genotypes?.map((genotype) => (
                    <SelectItem key={genotype.id} value={genotype.name}>
                      {genotype.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register("dateOfBirth")}
                data-testid="input-date-of-birth"
              />
              {form.formState.errors.dateOfBirth && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="weight">Weight (grams)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                max="1000"
                placeholder="25.5"
                {...form.register("weight")}
                data-testid="input-weight"
              />
              {form.formState.errors.weight && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.weight.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Enter weight in grams (e.g., 25.5)
              </p>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={form.watch("gender")}
                onValueChange={(value) => form.setValue("gender", value as "Male" | "Female")}
              >
                <SelectTrigger data-testid="select-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="Enter color"
                {...form.register("color")}
                data-testid="input-color"
              />
            </div>

            <div>
              <Label htmlFor="generation">Generation</Label>
              <Input
                id="generation"
                type="number"
                min="0"
                max="20"
                placeholder="0"
                {...form.register("generation")}
                data-testid="input-generation"
              />
              {form.formState.errors.generation && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.generation.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Research Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Research Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="protocol">Protocol</Label>
              <Input
                id="protocol"
                placeholder="Enter protocol"
                {...form.register("protocol")}
                data-testid="input-protocol"
              />
            </div>

            <div>
              <Label htmlFor="breedingStartDate">Breeding Start Date</Label>
              <Input
                id="breedingStartDate"
                type="date"
                {...form.register("breedingStartDate")}
                data-testid="input-breeding-start-date"
              />
              {form.formState.errors.breedingStartDate && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.breedingStartDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dateOfGenotyping">Date of Genotyping (DOG)</Label>
              <Input
                id="dateOfGenotyping"
                type="date"
                {...form.register("dateOfGenotyping")}
                data-testid="input-date-of-genotyping"
              />
              {form.formState.errors.dateOfGenotyping && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.dateOfGenotyping.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="genotypingUserId">Genotyping User</Label>
              <Select 
                value={form.watch("genotypingUserId")} 
                onValueChange={(value) => form.setValue("genotypingUserId", value)}
              >
                <SelectTrigger data-testid="select-genotyping-user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No user assigned</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="probes"
                checked={form.watch("probes")}
                onCheckedChange={(checked) => form.setValue("probes", !!checked)}
                data-testid="checkbox-probes"
              />
              <Label htmlFor="probes">Probes</Label>
            </div>
          </div>
        </div>

        {/* Health Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Health Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="healthStatus">Health Status</Label>
              <Select
                value={form.watch("healthStatus")}
                onValueChange={(value) => form.setValue("healthStatus", value as any)}
              >
                <SelectTrigger data-testid="select-health-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Healthy">Healthy</SelectItem>
                  <SelectItem value="Monitoring">Monitoring</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Quarantine">Quarantine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as any)}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                  <SelectItem value="Transferred">Transferred</SelectItem>
                  <SelectItem value="Sacrificed">Sacrificed</SelectItem>
                  <SelectItem value="Breeding">Breeding</SelectItem>
                  <SelectItem value="Replaced">Replaced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">

            <div>
              <Label htmlFor="diseases">Diseases/Conditions</Label>
              <Textarea
                id="diseases"
                placeholder="Enter any diseases or medical conditions..."
                {...form.register("diseases")}
                data-testid="textarea-diseases"
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes..."
                {...form.register("notes")}
                data-testid="textarea-notes"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createAnimalMutation.isPending || updateAnimalMutation.isPending}
            data-testid="button-save"
          >
            {createAnimalMutation.isPending || updateAnimalMutation.isPending 
              ? 'Saving...' 
              : (animal ? 'Update Animal' : 'Save Animal')
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
