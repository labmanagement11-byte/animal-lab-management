import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, UserCheck, Shield, Crown, Briefcase } from "lucide-react";
import { useState } from "react";

const updateRoleSchema = z.object({
  role: z.enum(['Admin', 'Success Manager', 'Director', 'Employee']),
});

type UpdateRoleForm = z.infer<typeof updateRoleSchema>;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<UpdateRoleForm>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      role: 'Employee',
    },
  });

  // Fetch all users (we'll need to create this endpoint)
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => 
      apiRequest('PUT', `/api/users/${data.email}/role`, { role: data.role }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleRoleUpdate = (data: UpdateRoleForm) => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({
      email: selectedUser.email,
      role: data.role,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Crown className="w-4 h-4" />;
      case 'Success Manager':
        return <Shield className="w-4 h-4" />;
      case 'Director':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <UserCheck className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'destructive';
      case 'Success Manager':
        return 'default';
      case 'Director':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    form.setValue('role', user.role);
    setDialogOpen(true);
  };

  const isCurrentUserAdmin = (currentUser as any)?.role === 'Admin';
  const isCurrentUserSuccessManager = (currentUser as any)?.role === 'Success Manager';

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="title-user-management">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions in the system
          </p>
        </div>
        <Badge variant="default">
          <Users className="w-4 h-4 mr-1" />
          {users?.length || 0} Users
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            System Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: any) => (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="font-medium" data-testid={`user-name-${user.id}`}>
                          {user.firstName || user.lastName 
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : 'Unknown User'
                          }
                        </p>
                        {user.email === (currentUser as any)?.email && (
                          <p className="text-xs text-muted-foreground">(You)</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`user-email-${user.id}`}>
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getRoleColor(user.role)} 
                      className="flex items-center w-fit"
                      data-testid={`user-role-${user.id}`}
                    >
                      {getRoleIcon(user.role)}
                      <span className="ml-1">{user.role}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(isCurrentUserAdmin || isCurrentUserSuccessManager) && 
                     user.email !== (currentUser as any)?.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoleDialog(user)}
                        disabled={updateRoleMutation.isPending}
                        data-testid={`button-edit-role-${user.id}`}
                      >
                        Edit Role
                      </Button>
                    )}
                    {user.email === (currentUser as any)?.email && (
                      <span className="text-sm text-muted-foreground">Current User</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!users || users.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRoleUpdate)} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Updating role for: <span className="font-medium">{selectedUser.email}</span>
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Employee">
                            <div className="flex items-center">
                              <UserCheck className="w-4 h-4 mr-2" />
                              Employee
                            </div>
                          </SelectItem>
                          <SelectItem value="Director">
                            <div className="flex items-center">
                              <Briefcase className="w-4 h-4 mr-2" />
                              Director
                            </div>
                          </SelectItem>
                          <SelectItem value="Success Manager">
                            <div className="flex items-center">
                              <Shield className="w-4 h-4 mr-2" />
                              Success Manager
                            </div>
                          </SelectItem>
                          {isCurrentUserAdmin && (
                            <SelectItem value="Admin">
                              <div className="flex items-center">
                                <Crown className="w-4 h-4 mr-2" />
                                Admin
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateRoleMutation.isPending}
                    data-testid="button-update-role"
                  >
                    {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}