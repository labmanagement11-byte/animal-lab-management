import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Animal, Cage } from "@shared/schema";

const animalFormSchema = z.object({
  animalNumber: z.string().min(1, "Animal number is required"),
  cageId: z.string().optional(),
  breed: z.string().min(1, "Breed is required"),
  age: z.string().optional(),
  weight: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  healthStatus: z.enum(["Healthy", "Monitoring", "Sick", "Quarantine"]).default("Healthy"),
  diseases: z.string().optional(),
  notes: z.string().optional(),
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

  const form = useForm<AnimalFormData>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      animalNumber: animal?.animalNumber || "",
      cageId: animal?.cageId || "none",
      breed: animal?.breed || "",
      age: animal?.age?.toString() || "",
      weight: animal?.weight || "",
      gender: animal?.gender || undefined,
      healthStatus: animal?.healthStatus || "Healthy",
      diseases: animal?.diseases || "",
      notes: animal?.notes || "",
    },
  });

  const createAnimalMutation = useMutation({
    mutationFn: async (data: AnimalFormData) => {
      const payload = {
        ...data,
        cageId: data.cageId === "none" ? undefined : data.cageId,
        age: data.age ? parseInt(data.age) : undefined,
        weight: data.weight || undefined,
      };
      await apiRequest("POST", "/api/animals", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
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
        age: data.age ? parseInt(data.age) : undefined,
        weight: data.weight || undefined,
      };
      await apiRequest("PUT", `/api/animals/${animal!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
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
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="animalNumber">Animal Number</Label>
            <Input
              id="animalNumber"
              placeholder="M-XXX"
              {...form.register("animalNumber")}
              data-testid="input-animal-number"
            />
            {form.formState.errors.animalNumber && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.animalNumber.message}
              </p>
            )}
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
            <Label htmlFor="breed">Breed</Label>
            <Select
              value={form.watch("breed")}
              onValueChange={(value) => form.setValue("breed", value)}
            >
              <SelectTrigger data-testid="select-breed">
                <SelectValue placeholder="Select breed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="C57BL/6">C57BL/6</SelectItem>
                <SelectItem value="BALB/c">BALB/c</SelectItem>
                <SelectItem value="DBA/2">DBA/2</SelectItem>
                <SelectItem value="129S1/SvImJ">129S1/SvImJ</SelectItem>
                <SelectItem value="NOD">NOD</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.breed && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.breed.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="age">Age (weeks)</Label>
            <Input
              id="age"
              type="number"
              placeholder="0"
              {...form.register("age")}
              data-testid="input-age"
            />
          </div>

          <div>
            <Label htmlFor="weight">Weight (grams)</Label>
            <Input
              id="weight"
              placeholder="0.0"
              {...form.register("weight")}
              data-testid="input-weight"
            />
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
        </div>

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
