import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Database, Settings, CheckCircle } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setupAdminMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/setup-admin'),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin privileges have been set up successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set up admin privileges",
        variant: "destructive",
      });
    },
  });

  const isAdmin = (user as any)?.role === 'Admin';
  const isTargetUser = (user as any)?.email === 'galindo243@live.com';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="title-admin-panel">Admin Panel</h1>
          <p className="text-muted-foreground">
            Administrative controls and system management
          </p>
        </div>
        <Badge variant={isAdmin ? "default" : "secondary"} data-testid="badge-admin-status">
          {isAdmin ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Admin Active
            </>
          ) : (
            "Admin Inactive"
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Admin Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Admin Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current user: <span className="font-medium" data-testid="text-current-user">{(user as any)?.email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Role: <span className="font-medium" data-testid="text-current-role">{(user as any)?.role}</span>
              </p>
            </div>
            
            {!isAdmin && isTargetUser && (
              <Button
                onClick={() => setupAdminMutation.mutate()}
                disabled={setupAdminMutation.isPending}
                className="w-full"
                data-testid="button-setup-admin"
              >
                {setupAdminMutation.isPending ? "Setting up..." : "Activate Admin Role"}
              </Button>
            )}

            {isAdmin && (
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Admin privileges active
              </div>
            )}

            {!isTargetUser && (
              <div className="text-sm text-muted-foreground">
                Only galindo243@live.com can set up admin privileges
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage user roles and permissions across the system.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/users'}
              data-testid="button-user-management"
            >
              Go to User Management
            </Button>
          </CardContent>
        </Card>

        {/* System Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              System status and administrative controls.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Database Status:</span>
                <span className="text-green-600 dark:text-green-400">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Authentication:</span>
                <span className="text-green-600 dark:text-green-400">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Features Section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Admin Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Full System Access</h4>
                <p className="text-sm text-muted-foreground">
                  As an admin, you have access to all features including:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• All animal and cage management</li>
                  <li>• User management and role assignment</li>
                  <li>• QR code generation and scanning</li>
                  <li>• Audit logs and system reports</li>
                  <li>• Administrative controls</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/'}
                    data-testid="button-dashboard"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/users'}
                    data-testid="button-users"
                  >
                    User Management
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/animals'}
                    data-testid="button-animals"
                  >
                    Animals
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}