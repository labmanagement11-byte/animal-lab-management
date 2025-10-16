import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Beaker, Box, Users, MoreVertical, FileText, File, Download } from "lucide-react";
import type { Strain, Cage, Animal } from "@shared/schema";
import { formatDate } from "@/utils/dateUtils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GenotypingReport {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
  companyId: string;
}

export default function StrainDetail() {
  const [, params] = useRoute("/strains/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const strainId = params?.id;

  const { data: strains, isLoading: strainsLoading } = useQuery<Strain[]>({
    queryKey: ['/api/strains'],
  });

  const { data: cages, isLoading: cagesLoading } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  const { data: animals, isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
  });

  const { data: genotypingReports, isLoading: reportsLoading } = useQuery<GenotypingReport[]>({
    queryKey: strainId ? ['/api/genotyping-reports/strain', strainId] : ['/api/genotyping-reports'],
    enabled: !!strainId,
  });

  const updateAnimalStatusMutation = useMutation({
    mutationFn: async ({ animal, status }: { animal: Animal; status: string }) => {
      const payload = {
        animalNumber: animal.animalNumber,
        cageId: animal.cageId || undefined,
        breed: animal.breed,
        genotype: animal.genotype || undefined,
        dateOfBirth: animal.dateOfBirth || undefined,
        weight: animal.weight || undefined,
        gender: animal.gender || undefined,
        color: animal.color || undefined,
        generation: animal.generation || undefined,
        protocol: animal.protocol || undefined,
        breedingStartDate: animal.breedingStartDate || undefined,
        dateOfGenotyping: animal.dateOfGenotyping || undefined,
        genotypingUserId: animal.genotypingUserId || undefined,
        probes: animal.probes || false,
        probeType: animal.probeType || undefined,
        allele: animal.allele || undefined,
        healthStatus: animal.healthStatus,
        status: status,
        diseases: animal.diseases || undefined,
        notes: animal.notes || undefined,
      };
      await apiRequest(`/api/animals/${animal.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
      toast({
        title: "Success",
        description: "Animal status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update animal status",
        variant: "destructive",
      });
    },
  });

  const strain = strains?.find(s => s.id === strainId);
  const strainCages = cages?.filter(c => c.strainId === strainId && !c.deletedAt) || [];
  const strainAnimals = animals?.filter(a => {
    const animalCage = cages?.find(c => c.id === a.cageId);
    return animalCage?.strainId === strainId && !a.deletedAt;
  }) || [];

  const isLoading = strainsLoading || cagesLoading || animalsLoading;

  const handleStatusChange = (animal: Animal, newStatus: string) => {
    updateAnimalStatusMutation.mutate({ animal, status: newStatus });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatReportDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-green-500" />;
  };

  const handleDownloadReport = (report: GenotypingReport) => {
    window.open(report.filePath, '_blank');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-40 bg-muted rounded"></div>
          <div className="h-60 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!strain) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Beaker className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Strain not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The strain you're looking for doesn't exist or was deleted
            </p>
            <Button onClick={() => setLocation('/strains')}>
              Back to Strains
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Monitoring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Sick':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Quarantine':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAnimalStatusColor = (status: string) => {
    switch (status) {
      case 'Reserved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200';
      case 'Transferred':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200';
      case 'Sacrificed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200';
      case 'Replaced':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/strains')}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Strains
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Beaker className="w-7 h-7 md:w-8 md:h-8" />
              {strain.name}
            </h1>
            {strain.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {strain.description}
              </p>
            )}
          </div>
          <Badge variant={strain.isActive ? "default" : "secondary"} data-testid="badge-status">
            {strain.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cages</p>
                <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-total-cages">
                  {strainCages.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Animals</p>
                <p className="text-3xl font-bold text-foreground mt-2" data-testid="text-total-animals">
                  {strainAnimals.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cages</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {strainCages.filter(c => c.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cages with this Strain ({strainCages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {strainCages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Number</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Room</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Capacity</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Animals</th>
                  </tr>
                </thead>
                <tbody>
                  {strainCages.map((cage) => {
                    const cageAnimals = animals?.filter(a => a.cageId === cage.id && !a.deletedAt) || [];
                    return (
                      <tr 
                        key={cage.id} 
                        className="border-b border-border hover:bg-accent/50 cursor-pointer"
                        onClick={() => setLocation(`/qr/cage/${cage.id}`)}
                        data-testid={`row-cage-${cage.id}`}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">{cage.cageNumber}</td>
                        <td className="py-3 px-4 text-foreground">{cage.roomNumber}</td>
                        <td className="py-3 px-4 text-foreground">{cage.location || 'N/A'}</td>
                        <td className="py-3 px-4 text-foreground">{cage.capacity}</td>
                        <td className="py-3 px-4">
                          <Badge variant={cage.isActive ? "default" : "secondary"}>
                            {cage.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground">{cageAnimals.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Box className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No cages with this strain</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Animals */}
      <Card>
        <CardHeader>
          <CardTitle>Animals with this Strain ({strainAnimals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {strainAnimals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Animal ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cage</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Gender</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Genotype</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Birth Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Age (weeks)</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Weight</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Health Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {strainAnimals.map((animal) => {
                    const cage = cages?.find(c => c.id === animal.cageId);
                    
                    // Calculate age in weeks from birth date
                    const calculateAgeInWeeks = (birthDate: Date | null | undefined): number | null => {
                      if (!birthDate) return null;
                      const now = new Date();
                      const birth = new Date(birthDate);
                      const diffTime = Math.abs(now.getTime() - birth.getTime());
                      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
                      return diffWeeks;
                    };
                    
                    const ageInWeeks = calculateAgeInWeeks(animal.dateOfBirth);
                    
                    return (
                      <tr 
                        key={animal.id} 
                        className="border-b border-border hover:bg-accent/50 cursor-pointer"
                        onClick={() => setLocation(`/qr/animal/${animal.id}`)}
                        data-testid={`row-animal-${animal.id}`}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">{animal.animalNumber}</td>
                        <td className="py-3 px-4 text-foreground">{cage?.cageNumber || 'N/A'}</td>
                        <td className="py-3 px-4 text-foreground">{animal.gender || 'N/A'}</td>
                        <td className="py-3 px-4 text-foreground">{animal.genotype || 'N/A'}</td>
                        <td className="py-3 px-4 text-foreground">
                          {animal.dateOfBirth ? formatDate(animal.dateOfBirth) : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {ageInWeeks !== null ? `${ageInWeeks} sem.` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {animal.weight ? `${animal.weight}g` : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getHealthStatusColor(animal.healthStatus || 'Healthy')}>
                            {animal.healthStatus || 'Healthy'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {animal.status && animal.status !== 'Active' && (
                            <Badge className={getAnimalStatusColor(animal.status)}>
                              {animal.status}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-actions-${animal.id}`}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(animal, 'Reserved')}
                                data-testid={`action-reserve-${animal.id}`}
                              >
                                Reserve
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(animal, 'Transferred')}
                                data-testid={`action-transfer-${animal.id}`}
                              >
                                Transfer
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(animal, 'Sacrificed')}
                                data-testid={`action-sacrifice-${animal.id}`}
                                className="text-red-600 dark:text-red-400"
                              >
                                Sacrifice
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(animal, 'Replaced')}
                                data-testid={`action-replace-${animal.id}`}
                              >
                                Replace
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No animals with this strain</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Genotyping Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Genotyping Reports ({genotypingReports?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : genotypingReports && genotypingReports.length > 0 ? (
            <div className="space-y-3">
              {genotypingReports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleDownloadReport(report)}
                  data-testid={`report-${report.id}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(report.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{report.originalName}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{formatFileSize(report.fileSize)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{formatReportDate(report.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadReport(report);
                    }}
                    data-testid={`button-download-${report.id}`}
                    className="self-end sm:self-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="sm:inline">Open</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No genotyping reports for this strain</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
