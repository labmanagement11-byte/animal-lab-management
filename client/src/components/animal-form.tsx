import { useState, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Animal, Cage, User, Strain, Genotype } from "@shared/schema";

const animalFormSchema = z.object({
  quantity: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 1 && num <= 50;
  }, "Quantity must be between 1 and 50"),
  animalNumber: z.string()
    .min(1, "Animal number is required")
    .regex(/^[A-Za-z0-9-]+$/i, "Animal number should contain only letters, numbers, and hyphens (e.g., M-001, F-123)")
    .transform(val => val.trim().toUpperCase()),
  cageId: z.string().optional(),
  breed: z.string().min(1, "Please select a strain from the dropdown"),
  genotype: z.string().optional(),
  status: z.enum(["Active", "Reserved", "Transferred", "Sacrificed", "Replaced"]).default("Active"),
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
  dateOfGenotyping: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const today = new Date();
    return date <= today;
  }, "Genotyping date cannot be in the future"),
  genotypingUserId: z.string().optional(),
  probes: z.boolean().default(false),
  probeType: z.string().optional(),
  allele: z.array(z.string()).default([]),
  healthStatus: z.enum(["Healthy", "Monitoring", "Sick", "Quarantine"]).default("Healthy"),
  diseases: z.string().optional(),
  notes: z.string().optional(),
});

type AnimalFormData = z.infer<typeof animalFormSchema>;

interface AnimalFormProps {
  animal?: Animal | null;
  onClose: () => void;
  initialCageId?: string;
}

interface IndividualAnimalData {
  animalNumber: string;
  breed: string;
  genotype?: string;
  weight?: string;
  gender?: "Male" | "Female";
  dateOfBirth?: string;
  healthStatus: "Healthy" | "Monitoring" | "Sick" | "Quarantine";
  diseases?: string;
  notes?: string;
}

export default function AnimalForm({ animal, onClose, initialCageId }: AnimalFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cageComboOpen, setCageComboOpen] = useState(false);
  const [genotypeComboOpen, setGenotypeComboOpen] = useState(false);
  const [newAllele, setNewAllele] = useState("");
  const [hasLastAnimal, setHasLastAnimal] = useState(false);
  const [showBatchTable, setShowBatchTable] = useState(false);
  const [batchAnimals, setBatchAnimals] = useState<IndividualAnimalData[]>([]);

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

  const generateAnimalNumber = () => {
    const prefix = Math.random() > 0.5 ? 'M' : 'F';
    const number = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${number}`;
  };

  const form = useForm<AnimalFormData>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      quantity: "1",
      animalNumber: animal?.animalNumber || generateAnimalNumber(),
      cageId: animal?.cageId || initialCageId || "none",
      breed: animal?.breed || "",
      genotype: animal?.genotype || "none",
      dateOfBirth: animal?.dateOfBirth ? new Date(animal.dateOfBirth).toISOString().split('T')[0] : "",
      weight: animal?.weight || "",
      gender: animal?.gender || undefined,
      color: animal?.color || "",
      generation: animal?.generation?.toString() || "",
      protocol: animal?.protocol || "",
      dateOfGenotyping: animal?.dateOfGenotyping ? new Date(animal.dateOfGenotyping).toISOString().split('T')[0] : "",
      genotypingUserId: animal?.genotypingUserId || "none",
      probes: animal?.probes || false,
      probeType: animal?.probeType || "",
      allele: animal?.allele || [],
      healthStatus: animal?.healthStatus || "Healthy",
      status: animal?.status || "Active",
      diseases: animal?.diseases || "",
      notes: animal?.notes || "",
    },
  });

  const createAnimalMutation = useMutation({
    mutationFn: async (data: AnimalFormData) => {
      const quantity = parseInt(data.quantity);
      const { quantity: _, ...dataWithoutQuantity } = data;
      
      const basePayload = {
        ...dataWithoutQuantity,
        cageId: data.cageId === "none" ? undefined : data.cageId,
        weight: data.weight || undefined,
        generation: data.generation ? parseInt(data.generation) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        dateOfGenotyping: data.dateOfGenotyping ? new Date(data.dateOfGenotyping).toISOString() : undefined,
        genotypingUserId: (data.genotypingUserId === "none" || data.genotypingUserId === "") ? undefined : data.genotypingUserId,
        genotype: data.genotype === "none" ? undefined : data.genotype,
      };
      
      // Use batch endpoint if quantity > 1
      if (quantity > 1) {
        await apiRequest("/api/animals/batch", {
          method: "POST",
          body: JSON.stringify({ ...basePayload, quantity }),
          headers: { "Content-Type": "application/json" }
        });
      } else {
        await apiRequest("/api/animals", {
          method: "POST",
          body: JSON.stringify(basePayload),
          headers: { "Content-Type": "application/json" }
        });
      }
    },
    onSuccess: (_, variables) => {
      const quantity = parseInt(variables.quantity);
      
      // Save last animal data to localStorage for quick copy
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastAnimalData', JSON.stringify(variables));
        setHasLastAnimal(true);
      }
      
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/animals';
        }
      });
      toast({
        title: "Success",
        description: quantity > 1 
          ? `${quantity} animals created successfully` 
          : "Animal created successfully",
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
      const { quantity: _, ...dataWithoutQuantity } = data;
      const payload = {
        ...dataWithoutQuantity,
        cageId: data.cageId === "none" ? undefined : data.cageId,
        weight: data.weight || undefined,
        generation: data.generation ? parseInt(data.generation) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        dateOfGenotyping: data.dateOfGenotyping ? new Date(data.dateOfGenotyping).toISOString() : undefined,
        genotypingUserId: (data.genotypingUserId === "none" || data.genotypingUserId === "") ? undefined : data.genotypingUserId,
        genotype: data.genotype === "none" ? undefined : data.genotype,
      };
      await apiRequest(`/api/animals/${animal!.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });
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

  const copyLastAnimal = () => {
    const lastAnimalDataStr = localStorage.getItem('lastAnimalData');
    if (!lastAnimalDataStr) {
      toast({
        title: "No previous animal",
        description: "Create an animal first to use this feature.",
        variant: "destructive",
      });
      return;
    }

    try {
      const lastData = JSON.parse(lastAnimalDataStr) as AnimalFormData;
      
      // Generate new animal number
      const newAnimalNumber = generateAnimalNumber();
      
      // Fill form with last animal data, but with new number
      form.reset({
        ...lastData,
        animalNumber: newAnimalNumber,
        quantity: "1", // Reset quantity to 1
      });

      toast({
        title: "Success",
        description: "Form filled with last animal data. Change the animal number if needed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load last animal data.",
        variant: "destructive",
      });
    }
  };

  // Prepare batch animals when quantity changes
  const prepareBatchAnimals = () => {
    const currentFormData = form.getValues();
    const quantity = parseInt(currentFormData.quantity);
    
    if (quantity > 1) {
      const animals: IndividualAnimalData[] = [];
      const baseNumber = currentFormData.animalNumber.replace(/\d+$/, '');
      const startNum = parseInt(currentFormData.animalNumber.match(/\d+$/)?.[0] || '1');
      
      for (let i = 0; i < quantity; i++) {
        const animalNumber = baseNumber + String(startNum + i).padStart(3, '0');
        animals.push({
          animalNumber,
          breed: currentFormData.breed,
          genotype: currentFormData.genotype === "none" ? undefined : currentFormData.genotype,
          weight: currentFormData.weight,
          gender: currentFormData.gender,
          dateOfBirth: currentFormData.dateOfBirth,
          healthStatus: currentFormData.healthStatus,
          diseases: currentFormData.diseases,
          notes: currentFormData.notes,
        });
      }
      
      setBatchAnimals(animals);
      setShowBatchTable(true);
    } else {
      setShowBatchTable(false);
      setBatchAnimals([]);
    }
  };

  const updateBatchAnimal = (index: number, field: keyof IndividualAnimalData, value: any) => {
    setBatchAnimals(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const onSubmit = (data: AnimalFormData) => {
    if (animal) {
      updateAnimalMutation.mutate(data);
    } else {
      const quantity = parseInt(data.quantity);
      if (quantity > 1 && showBatchTable) {
        // Submit with individual data
        createAnimalMutation.mutate({
          ...data,
          individualAnimals: batchAnimals
        } as any);
      } else {
        createAnimalMutation.mutate(data);
      }
    }
  };

  // Check localStorage for last animal data on mount and when dialog opens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastAnimalData = localStorage.getItem('lastAnimalData');
      setHasLastAnimal(!!lastAnimalData);
    }
  }, []);

  return (
    <div>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle>{animal ? 'Edit Animal' : 'Add New Animal'}</DialogTitle>
          {!animal && hasLastAnimal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyLastAnimal}
              className="ml-2"
              data-testid="button-copy-last-animal"
            >
              <Plus className="w-4 h-4 mr-1" />
              Copy Last
            </Button>
          )}
        </div>
      </DialogHeader>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4 max-h-[80vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
          
          {/* Quantity Counter - Only show when creating new animals */}
          {!animal && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <Label htmlFor="quantity" className="text-base font-semibold">
                How many animals to create? *
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="1"
                  {...form.register("quantity")}
                  className="text-lg font-medium flex-1"
                  data-testid="input-quantity"
                />
                {parseInt(form.watch("quantity") || "1") > 1 && (
                  <Button
                    type="button"
                    onClick={prepareBatchAnimals}
                    variant="secondary"
                    data-testid="button-prepare-individual"
                  >
                    Prepare Individual Data
                  </Button>
                )}
              </div>
              {form.formState.errors.quantity && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.quantity.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {parseInt(form.watch("quantity") || "1") > 1 
                  ? "Click 'Prepare Individual Data' to enter information for each animal separately."
                  : "Enter the number of similar animals to create (1-50). The system will auto-generate unique animal numbers for each."
                }
              </p>
            </div>
          )}

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
              <Popover open={cageComboOpen} onOpenChange={setCageComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={cageComboOpen}
                    className="w-full justify-between"
                    data-testid="button-cage-combobox"
                  >
                    {form.watch("cageId") && form.watch("cageId") !== "none"
                      ? (() => {
                          const selectedCage = cages?.find((c) => c.id === form.watch("cageId"));
                          return selectedCage ? `${selectedCage.cageNumber} - ${selectedCage.location}` : "Select cage";
                        })()
                      : "Select cage or type to search..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Type cage number or location..."
                      data-testid="input-cage-search"
                    />
                    <CommandList>
                      <CommandEmpty>No cage found</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            form.setValue("cageId", "none");
                            setCageComboOpen(false);
                          }}
                          data-testid="option-no-cage"
                        >
                          <Check className={`mr-2 h-4 w-4 ${form.watch("cageId") === "none" ? "opacity-100" : "opacity-0"}`} />
                          No cage assigned
                        </CommandItem>
                        {cages?.map((cage) => (
                          <CommandItem
                            key={cage.id}
                            value={`${cage.cageNumber} ${cage.location}`}
                            onSelect={() => {
                              form.setValue("cageId", cage.id);
                              setCageComboOpen(false);
                            }}
                            data-testid={`option-cage-${cage.id}`}
                          >
                            <Check className={`mr-2 h-4 w-4 ${form.watch("cageId") === cage.id ? "opacity-100" : "opacity-0"}`} />
                            {cage.cageNumber} - {cage.location}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <Popover open={genotypeComboOpen} onOpenChange={setGenotypeComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={genotypeComboOpen}
                    className="w-full justify-between"
                    data-testid="button-genotype-combobox"
                  >
                    {form.watch("genotype") && form.watch("genotype") !== "none"
                      ? (() => {
                          const selectedGenotype = genotypes?.find((g) => g.name === form.watch("genotype"));
                          return selectedGenotype ? selectedGenotype.name : "Select genotype";
                        })()
                      : "Select genotype or type to search..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Type genotype name..."
                      data-testid="input-genotype-search"
                    />
                    <CommandList>
                      <CommandEmpty>No genotype found</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            form.setValue("genotype", "none");
                            setGenotypeComboOpen(false);
                          }}
                          data-testid="option-no-genotype"
                        >
                          <Check className={`mr-2 h-4 w-4 ${form.watch("genotype") === "none" ? "opacity-100" : "opacity-0"}`} />
                          No genotype
                        </CommandItem>
                        {genotypes?.map((genotype) => (
                          <CommandItem
                            key={genotype.id}
                            value={genotype.name}
                            onSelect={() => {
                              form.setValue("genotype", genotype.name);
                              setGenotypeComboOpen(false);
                            }}
                            data-testid={`option-genotype-${genotype.id}`}
                          >
                            <Check className={`mr-2 h-4 w-4 ${form.watch("genotype") === genotype.name ? "opacity-100" : "opacity-0"}`} />
                            {genotype.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <select
                id="genotypingUserId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("genotypingUserId")}
                data-testid="select-genotyping-user"
              >
                <option value="">Select user</option>
                <option value="none">No user assigned</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="probes"
                  checked={form.watch("probes")}
                  onCheckedChange={(checked) => form.setValue("probes", !!checked)}
                  data-testid="checkbox-probes"
                />
                <Label htmlFor="probes">Probes</Label>
              </div>
              
              {form.watch("probes") && (
                <div className="space-y-4 ml-6 mt-2">
                  <div>
                    <Label htmlFor="probeType">Probe Type</Label>
                    <Input
                      id="probeType"
                      placeholder="Enter probe type..."
                      {...form.register("probeType")}
                      data-testid="input-probe-type"
                    />
                  </div>
                  <div>
                    <Label htmlFor="allele">Allele</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="allele"
                          placeholder="Enter allele..."
                          value={newAllele}
                          onChange={(e) => setNewAllele(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newAllele.trim()) {
                                const currentAlleles = form.getValues("allele") || [];
                                form.setValue("allele", [...currentAlleles, newAllele.trim()]);
                                setNewAllele("");
                              }
                            }
                          }}
                          data-testid="input-allele"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (newAllele.trim()) {
                              const currentAlleles = form.getValues("allele") || [];
                              form.setValue("allele", [...currentAlleles, newAllele.trim()]);
                              setNewAllele("");
                            }
                          }}
                          data-testid="button-add-allele"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {form.watch("allele")?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {form.watch("allele").map((allele, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                              data-testid={`allele-tag-${index}`}
                            >
                              <span>{allele}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentAlleles = form.getValues("allele") || [];
                                  form.setValue("allele", currentAlleles.filter((_, i) => i !== index));
                                }}
                                className="hover:bg-secondary-foreground/10 rounded-full p-0.5"
                                data-testid={`button-remove-allele-${index}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

        {/* Batch Animals Table - Only show when editing individual data */}
        {showBatchTable && batchAnimals.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-medium border-b pb-2">Individual Animal Data</h3>
            <p className="text-sm text-muted-foreground">Edit each animal's information below. Click Submit when done.</p>
            
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Animal #</TableHead>
                    <TableHead className="min-w-[150px]">Strain</TableHead>
                    <TableHead className="min-w-[120px]">Genotype</TableHead>
                    <TableHead className="min-w-[100px]">Weight (g)</TableHead>
                    <TableHead className="min-w-[100px]">Gender</TableHead>
                    <TableHead className="min-w-[130px]">Birth Date</TableHead>
                    <TableHead className="min-w-[120px]">Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchAnimals.map((animal, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={animal.animalNumber}
                          onChange={(e) => updateBatchAnimal(index, 'animalNumber', e.target.value)}
                          className="min-w-[100px]"
                          data-testid={`input-batch-animal-number-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={animal.breed}
                          onValueChange={(value) => updateBatchAnimal(index, 'breed', value)}
                        >
                          <SelectTrigger data-testid={`select-batch-strain-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {strains?.map((strain) => (
                              <SelectItem key={strain.id} value={strain.name}>
                                {strain.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={animal.genotype || "none"}
                          onValueChange={(value) => updateBatchAnimal(index, 'genotype', value === "none" ? undefined : value)}
                        >
                          <SelectTrigger data-testid={`select-batch-genotype-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No genotype</SelectItem>
                            {genotypes?.map((genotype) => (
                              <SelectItem key={genotype.id} value={genotype.name}>
                                {genotype.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={animal.weight || ""}
                          onChange={(e) => updateBatchAnimal(index, 'weight', e.target.value)}
                          placeholder="25"
                          className="min-w-[80px]"
                          data-testid={`input-batch-weight-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={animal.gender || "none"}
                          onValueChange={(value) => updateBatchAnimal(index, 'gender', value === "none" ? undefined : value as any)}
                        >
                          <SelectTrigger data-testid={`select-batch-gender-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={animal.dateOfBirth || ""}
                          onChange={(e) => updateBatchAnimal(index, 'dateOfBirth', e.target.value)}
                          className="min-w-[120px]"
                          data-testid={`input-batch-dob-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={animal.healthStatus}
                          onValueChange={(value) => updateBatchAnimal(index, 'healthStatus', value as any)}
                        >
                          <SelectTrigger data-testid={`select-batch-health-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Healthy">Healthy</SelectItem>
                            <SelectItem value="Monitoring">Monitoring</SelectItem>
                            <SelectItem value="Sick">Sick</SelectItem>
                            <SelectItem value="Quarantine">Quarantine</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

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
