import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  BarChart3, 
  Users, 
  Home,
  Activity,
  Calendar,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import type { Animal, Cage, User } from "@shared/schema";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>("animals");
  const [dateRange, setDateRange] = useState<string>("30");

  // Fetch data for reports
  const { data: animals, isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
  });

  const { data: cages, isLoading: cagesLoading } = useQuery<Cage[]>({
    queryKey: ['/api/cages'],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const isLoading = animalsLoading || cagesLoading || usersLoading;

  // Calculate statistics
  const stats = {
    totalAnimals: animals?.length || 0,
    activeAnimals: animals?.filter(a => a.status === 'Active').length || 0,
    totalCages: cages?.length || 0,
    activeCages: cages?.filter(c => c.status === 'Active').length || 0,
    totalUsers: users?.length || 0,
    healthyAnimals: animals?.filter(a => a.healthStatus === 'Healthy').length || 0,
    sickAnimals: animals?.filter(a => a.healthStatus === 'Sick').length || 0,
    monitoringAnimals: animals?.filter(a => a.healthStatus === 'Monitoring').length || 0,
  };

  // Get strain distribution
  const strainDistribution = animals?.reduce((acc, animal) => {
    const strain = animal.breed || 'Unknown';
    acc[strain] = (acc[strain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Get cage utilization
  const cageUtilization = cages?.map(cage => {
    const animalsInCage = animals?.filter(a => a.cageId === cage.id).length || 0;
    const utilization = cage.capacity ? (animalsInCage / cage.capacity) * 100 : 0;
    return {
      cageNumber: cage.cageNumber,
      location: cage.location,
      capacity: cage.capacity || 0,
      occupied: animalsInCage,
      utilization: Math.round(utilization),
    };
  }) || [];

  // Export functionality
  const exportReport = () => {
    const csvData = generateCSVData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVData = () => {
    switch (reportType) {
      case 'animals':
        const animalHeaders = 'Animal Number,Cage,Strain,Gender,Age,Weight,Health Status,Status,Location\n';
        const animalRows = animals?.map(animal => {
          const cage = cages?.find(c => c.id === animal.cageId);
          return [
            animal.animalNumber,
            cage?.cageNumber || 'N/A',
            animal.breed || 'Unknown',
            animal.gender || 'N/A',
            animal.age || 'N/A',
            animal.weight || 'N/A',
            animal.healthStatus || 'N/A',
            animal.status || 'N/A',
            cage?.location || 'N/A'
          ].join(',');
        }).join('\n') || '';
        return animalHeaders + animalRows;
        
      case 'cages':
        const cageHeaders = 'Cage Number,Room,Location,Capacity,Current Occupancy,Utilization %,Status\n';
        const cageRows = cageUtilization.map(cage => {
          return [
            cage.cageNumber,
            'N/A', // Room data not in current schema
            cage.location,
            cage.capacity,
            cage.occupied,
            cage.utilization + '%',
            'Active'
          ].join(',');
        }).join('\n');
        return cageHeaders + cageRows;
        
      default:
        return 'No data available for export\n';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">System analytics and data reports</p>
          </div>
        </div>
        <div className="text-center py-8">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">System analytics and data reports</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40" data-testid="select-report-type">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="animals">Animals</SelectItem>
              <SelectItem value="cages">Cages</SelectItem>
              <SelectItem value="health">Health Status</SelectItem>
              <SelectItem value="strains">Strains</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32" data-testid="select-date-range">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportReport} data-testid="button-export-report">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-animals">{stats.totalAnimals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAnimals} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cages</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-cages">{stats.totalCages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCages} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-healthy-animals">
              {stats.healthyAnimals}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.sickAnimals} sick, {stats.monitoringAnimals} monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-users">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      {reportType === 'animals' && (
        <Card>
          <CardHeader>
            <CardTitle>Animal Inventory Report</CardTitle>
            <CardDescription>Complete list of all animals in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal Number</TableHead>
                  <TableHead>Cage</TableHead>
                  <TableHead>Strain</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Health Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animals?.map((animal) => {
                  const cage = cages?.find(c => c.id === animal.cageId);
                  return (
                    <TableRow key={animal.id} data-testid={`report-animal-${animal.id}`}>
                      <TableCell className="font-medium">{animal.animalNumber}</TableCell>
                      <TableCell>{cage?.cageNumber || 'N/A'}</TableCell>
                      <TableCell>{animal.breed || 'Unknown'}</TableCell>
                      <TableCell>{animal.gender || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          animal.healthStatus === 'Healthy' ? 'bg-green-100 text-green-800' :
                          animal.healthStatus === 'Sick' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {animal.healthStatus || 'Healthy'}
                        </span>
                      </TableCell>
                      <TableCell>{animal.status || 'Active'}</TableCell>
                      <TableCell>{cage?.location || 'N/A'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === 'cages' && (
        <Card>
          <CardHeader>
            <CardTitle>Cage Utilization Report</CardTitle>
            <CardDescription>Current occupancy and utilization of all cages</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cage Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Current Occupancy</TableHead>
                  <TableHead>Utilization %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cageUtilization.map((cage) => (
                  <TableRow key={cage.cageNumber} data-testid={`report-cage-${cage.cageNumber}`}>
                    <TableCell className="font-medium">{cage.cageNumber}</TableCell>
                    <TableCell>{cage.location}</TableCell>
                    <TableCell>{cage.capacity}</TableCell>
                    <TableCell>{cage.occupied}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cage.utilization <= 50 ? 'bg-green-100 text-green-800' :
                        cage.utilization <= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {cage.utilization}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === 'strains' && (
        <Card>
          <CardHeader>
            <CardTitle>Strain Distribution Report</CardTitle>
            <CardDescription>Distribution of animals by strain</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strain</TableHead>
                  <TableHead>Animal Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(strainDistribution).map(([strain, count]) => (
                  <TableRow key={strain} data-testid={`report-strain-${strain}`}>
                    <TableCell className="font-medium">{strain}</TableCell>
                    <TableCell>{count}</TableCell>
                    <TableCell>
                      {stats.totalAnimals > 0 ? 
                        ((count / stats.totalAnimals) * 100).toFixed(1) + '%' : 
                        '0%'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Health Status Summary</CardTitle>
              <CardDescription>Current health status distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Healthy</span>
                <span className="text-sm font-medium text-green-600">{stats.healthyAnimals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Monitoring</span>
                <span className="text-sm font-medium text-yellow-600">{stats.monitoringAnimals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sick</span>
                <span className="text-sm font-medium text-red-600">{stats.sickAnimals}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Animals Requiring Attention</CardTitle>
              <CardDescription>Animals with health concerns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animals?.filter(a => a.healthStatus !== 'Healthy').map((animal) => (
                    <TableRow key={animal.id} data-testid={`health-concern-${animal.id}`}>
                      <TableCell className="font-medium">{animal.animalNumber}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          animal.healthStatus === 'Sick' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {animal.healthStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {animal.notes || animal.diseases || 'No notes'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}