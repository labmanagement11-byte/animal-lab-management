import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, Users, Calendar, Clock, Thermometer, AlertCircle, FileText, QrCode, History, User } from "lucide-react";
import type { Cage, Animal, AuditLog, User as UserType } from "@shared/schema";

export default function CageQrDetail() {
  const params = useParams();
  const cageId = params.id;

  // Fetch cage details
  const { data: cage, isLoading: isLoadingCage } = useQuery<Cage>({
    queryKey: ['/api/cages', cageId],
    queryFn: async () => {
      const response = await fetch(`/api/cages/${cageId}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!cageId,
  });

  // Fetch animals in this cage
  const { data: animals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ['/api/animals/by-cage', cageId],
    queryFn: async () => {
      const response = await fetch(`/api/animals?cageId=${cageId}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const allAnimals = await response.json();
      return allAnimals.filter((animal: Animal) => animal.cageId === cageId);
    },
    enabled: !!cageId,
  });

  // Fetch audit logs for this cage
  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery<AuditLog[]>({
    queryKey: ['/api/cages', cageId, 'audit-logs'],
    queryFn: async () => {
      const response = await fetch(`/api/cages/${cageId}/audit-logs`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!cageId,
  });

  // Fetch all users to match audit log user IDs with names
  const { data: users } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return 'System';
    const user = users?.find(u => u.id === userId);
    if (!user) return 'Unknown User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Created';
      case 'UPDATE': return 'Updated';
      case 'DELETE': return 'Deleted';
      case 'SOFT_DELETE': return 'Moved to Trash';
      case 'RESTORE': return 'Restored';
      case 'PERMANENT_DELETE': return 'Permanently Deleted';
      default: return action;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Breeding':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Holding':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

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

  if (isLoadingCage) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cage details...</p>
        </div>
      </div>
    );
  }

  if (!cage) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Cage Not Found</h1>
          <p className="text-muted-foreground">The requested cage could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-cage-qr-title">
                Cage {cage.cageNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                Laboratory Animal Management System
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Cage Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Cage Information
              <Badge className={getStatusColor(cage.status || 'Active')}>
                {cage.status || 'Active'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium" data-testid="text-cage-location">
                      Room {cage.roomNumber} - {cage.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Capacity</div>
                    <div className="font-medium" data-testid="text-cage-capacity">
                      {cage.capacity || 'Not specified'} animals
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                    <div className="font-medium">
                      {cage.updatedAt ? new Date(cage.updatedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Current Occupancy</div>
                    <div className="font-medium" data-testid="text-current-occupancy">
                      {isLoadingAnimals ? 'Loading...' : `${animals?.length || 0} animals`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animals in Cage */}
        {!isLoadingAnimals && animals && animals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Animals in this Cage ({animals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {animals.map((animal) => (
                  <Card key={animal.id} className="border border-border shadow-sm">
                    <CardContent className="p-4">
                      {/* Animal Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg" data-testid={`animal-number-${animal.id}`}>
                            {animal.animalNumber}
                          </span>
                          <Badge className={getHealthStatusColor(animal.healthStatus || 'Healthy')}>
                            {animal.healthStatus || 'Healthy'}
                          </Badge>
                          {animal.status && animal.status !== 'Active' && (
                            <Badge variant="secondary" className="text-xs">
                              {animal.status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Animal Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {/* Basic Information */}
                        <div className="space-y-2">
                          <div className="text-muted-foreground font-medium">Basic Information</div>
                          <div className="space-y-1">
                            <div><span className="text-muted-foreground">Strain:</span> {animal.breed}</div>
                            {animal.gender && <div><span className="text-muted-foreground">Gender:</span> {animal.gender}</div>}
                            {animal.weight && <div><span className="text-muted-foreground">Weight:</span> {animal.weight}g</div>}
                            {animal.color && <div><span className="text-muted-foreground">Color:</span> {animal.color}</div>}
                            {animal.generation && <div><span className="text-muted-foreground">Generation:</span> {animal.generation}</div>}
                          </div>
                        </div>

                        {/* Dates and Times */}
                        <div className="space-y-2">
                          <div className="text-muted-foreground font-medium">Dates & Times</div>
                          <div className="space-y-1">
                            {animal.dateOfBirth && (
                              <div><span className="text-muted-foreground">Birth Date:</span> {new Date(animal.dateOfBirth).toLocaleDateString()}</div>
                            )}
                            {animal.age && (
                              <div><span className="text-muted-foreground">Age:</span> {animal.age} weeks</div>
                            )}
                            {animal.breedingStartDate && (
                              <div><span className="text-muted-foreground">Breeding Start:</span> {new Date(animal.breedingStartDate).toLocaleDateString()}</div>
                            )}
                            {animal.dateOfGenotyping && (
                              <div><span className="text-muted-foreground">Genotyping Date:</span> {new Date(animal.dateOfGenotyping).toLocaleDateString()}</div>
                            )}
                            {animal.createdAt && (
                              <div><span className="text-muted-foreground">Added:</span> {new Date(animal.createdAt).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Health and Disease Information */}
                      {(animal.diseases || animal.notes) && (
                        <div className="mt-4 pt-3 border-t border-border space-y-3">
                          {animal.diseases && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-muted-foreground">Diseases/Conditions</span>
                              </div>
                              <div className="text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded">
                                {animal.diseases}
                              </div>
                            </div>
                          )}
                          {animal.notes && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-muted-foreground">Notes</span>
                              </div>
                              <div className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded">
                                {animal.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Additional Information */}
                      {(animal.genotype || animal.protocol) && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="text-sm space-y-1">
                            <div className="text-muted-foreground font-medium mb-2">Additional Information</div>
                            {animal.genotype && (
                              <div><span className="text-muted-foreground">Genotype:</span> {animal.genotype}</div>
                            )}
                            {animal.protocol && (
                              <div><span className="text-muted-foreground">Protocol:</span> {animal.protocol}</div>
                            )}
                            {animal.probes && (
                              <div><span className="text-muted-foreground">Probes:</span> Yes</div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty cage message */}
        {!isLoadingAnimals && (!animals || animals.length === 0) && (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Animals</h3>
              <p className="text-muted-foreground" data-testid="text-empty-cage">
                This cage currently has no animals assigned to it.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Audit History */}
        {!isLoadingLogs && auditLogs && auditLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="border border-border rounded-lg p-3 bg-muted/30"
                    data-testid={`audit-log-${log.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getActionLabel(log.action)}
                          </Badge>
                          <span className="text-sm font-medium">{getUserName(log.userId)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {log.timestamp 
                                ? new Date(log.timestamp).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  }) 
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {log.timestamp 
                                ? new Date(log.timestamp).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit', 
                                    second: '2-digit' 
                                  }) 
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-muted-foreground">
          <p>Laboratory Animal Management System</p>
          <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}