import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Trash2, Download, Loader2, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Strain {
  id: string;
  name: string;
}

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

export default function GenotypingReportsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStrains, setSelectedStrains] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: reports, isLoading: reportsLoading } = useQuery<GenotypingReport[]>({
    queryKey: ['/api/genotyping-reports'],
  });

  const { data: strains, isLoading: strainsLoading } = useQuery<Strain[]>({
    queryKey: ['/api/strains'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Get upload URL
      const uploadUrlResponse = await apiRequest('/api/genotyping-reports/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      });

      const { uploadURL } = await uploadUrlResponse.json() as { uploadURL: string };

      // Validate upload URL
      if (!uploadURL) {
        throw new Error('Failed to get upload URL from server');
      }

      // Step 2: Upload file to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
      }

      // Step 3: Create report record
      const fileURL = uploadURL.split('?')[0];
      const reportResponse = await apiRequest('/api/genotyping-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileURL,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          strainIds: selectedStrains,
        }),
      });

      return reportResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/genotyping-reports'] });
      toast({
        title: "Success",
        description: "Report uploaded successfully.",
      });
      setSelectedFile(null);
      setSelectedStrains([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Error uploading report.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/genotyping-reports/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/genotyping-reports'] });
      toast({
        title: "Success",
        description: "Report deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error deleting report.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Only PDF and Excel files are allowed.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 50MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (selectedStrains.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one strain.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = (report: GenotypingReport) => {
    window.open(report.filePath, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
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

  const handleStrainToggle = (strainId: string) => {
    setSelectedStrains(prev => 
      prev.includes(strainId) 
        ? prev.filter(id => id !== strainId)
        : [...prev, strainId]
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h2 className="text-lg md:text-2xl font-semibold text-foreground">Genotyping Reports</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Upload and manage genotyping history reports</p>
        </div>
      </div>

      {/* Upload Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload New Report
          </CardTitle>
          <CardDescription>
            Upload PDF or Excel files associated with multiple strains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select File (PDF or Excel)</Label>
            <Input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              accept=".pdf,.xls,.xlsx"
              onChange={handleFileSelect}
              data-testid="input-file-upload"
              disabled={uploadMutation.isPending}
              className="mt-2"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <div>
            <Label>Associated Strains</Label>
            {strainsLoading ? (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading strains...</span>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {strains?.map((strain) => (
                  <Badge
                    key={strain.id}
                    variant={selectedStrains.includes(strain.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleStrainToggle(strain.id)}
                    data-testid={`badge-strain-${strain.id}`}
                  >
                    {strain.name}
                  </Badge>
                ))}
              </div>
            )}
            {selectedStrains.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedStrains.length} strain{selectedStrains.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !selectedFile || selectedStrains.length === 0}
            data-testid="button-upload-report"
            className="w-full md:w-auto"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Reports</CardTitle>
          <CardDescription>
            View and manage all genotyping reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`report-${report.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getFileIcon(report.fileType)}
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{report.originalName}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{formatFileSize(report.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(report.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report)}
                      data-testid={`button-download-${report.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${report.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No reports uploaded yet. Upload your first genotyping report above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
