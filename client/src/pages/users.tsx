import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, UserCheck, Shield, Crown, Briefcase, UserPlus, Copy, Mail, Ban, Unlock, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";

const updateRoleSchema = z.object({
  role: z.enum(['Admin', 'Success Manager', 'Director', 'Employee']),
});

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['Admin', 'Success Manager', 'Director', 'Employee']),
});

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['Admin', 'Success Manager', 'Director', 'Employee']),
  companyId: z.string().optional(),
});

type UpdateRoleForm = z.infer<typeof updateRoleSchema>;
type InviteUserForm = z.infer<typeof inviteUserSchema>;
type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [invitationLink, setInvitationLink] = useState("");

  const isCurrentUserAdmin = (currentUser as any)?.role === 'Admin';
  const isCurrentUserDirector = (currentUser as any)?.role === 'Director';
  const isCurrentUserSuccessManager = (currentUser as any)?.role === 'Success Manager';
  const canInviteUsers = isCurrentUserAdmin || isCurrentUserDirector;

  const form = useForm<UpdateRoleForm>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      role: 'Employee',
    },
  });

  const inviteForm = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role: 'Employee',
    },
  });

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema.extend({
      companyId: isCurrentUserAdmin 
        ? z.string().min(1, 'Company is required for Admin')
        : z.string().optional(),
    })),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'Employee',
      companyId: isCurrentUserDirector ? (currentUser as any)?.companyId || '' : '',
    },
  });

  // Fetch all users (we'll need to create this endpoint)
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Fetch all companies
  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
    retry: false,
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => 
      apiRequest(`/api/users/${data.email}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: data.role }),
        headers: { 'Content-Type': 'application/json' }
      }),
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

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserForm) => {
      const response = await apiRequest('/api/invitations', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${data.invitation.email}`,
      });
      setInvitationLink(data.invitationLink);
      inviteForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest(`/api/users/${userId}/block`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User blocked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to block user",
        variant: "destructive",
      });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest(`/api/users/${userId}/unblock`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User unblocked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unblock user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest(`/api/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserForm) => 
      apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
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

  const handleInviteUser = (data: InviteUserForm) => {
    inviteUserMutation.mutate(data);
  };

  const handleCreateUser = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: "Copied!",
      description: "Invitation link copied to clipboard",
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="title-user-management">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions in the system
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canInviteUsers && (
            <>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                data-testid="button-create-user"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
              <Button 
                onClick={() => setInviteDialogOpen(true)}
                variant="outline"
                data-testid="button-invite-user"
              >
                <Mail className="w-4 h-4 mr-2" />
                Invitar por Email
              </Button>
            </>
          )}
          <Badge variant="default" className="w-fit">
            <Users className="w-4 h-4 mr-1" />
            {users?.length || 0} Users
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            System Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
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
                    {user.isBlocked ? (
                      <Badge variant="destructive" className="flex items-center w-fit">
                        <Ban className="w-3 h-3 mr-1" />
                        Blocked
                      </Badge>
                    ) : user.deletedAt ? (
                      <Badge variant="secondary" className="flex items-center w-fit">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Deleted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center w-fit">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.email === (currentUser as any)?.email ? (
                      <span className="text-sm text-muted-foreground">Current User</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {(isCurrentUserAdmin || isCurrentUserSuccessManager) && (
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
                        {isCurrentUserAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-actions-${user.id}`}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.isBlocked ? (
                                <DropdownMenuItem 
                                  onClick={() => unblockUserMutation.mutate(user.id)}
                                  disabled={unblockUserMutation.isPending}
                                  data-testid={`menu-unblock-${user.id}`}
                                >
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Unblock User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => blockUserMutation.mutate(user.id)}
                                  disabled={blockUserMutation.isPending}
                                  data-testid={`menu-block-${user.id}`}
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Block User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                                className="text-destructive focus:text-destructive"
                                data-testid={`menu-delete-${user.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>

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

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation to a new user via email. Only Admin and Director can invite users.
            </DialogDescription>
          </DialogHeader>
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(handleInviteUser)} className="space-y-4">
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="user@example.com" 
                        {...field} 
                        data-testid="input-invite-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-invite-role">
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

              {invitationLink && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Invitation Link</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={copyInvitationLink}
                      data-testid="button-copy-link"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground break-all">
                    {invitationLink}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Share this link with the invited user
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInviteDialogOpen(false);
                    setInvitationLink("");
                    inviteForm.reset();
                  }}
                  data-testid="button-cancel-invite"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteUserMutation.isPending}
                  data-testid="button-send-invite"
                >
                  {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crear un usuario directamente especificando sus datos. Solo Admin y Director pueden crear usuarios.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="usuario@ejemplo.com" 
                        {...field} 
                        data-testid="input-create-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Juan" 
                          {...field} 
                          data-testid="input-create-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Pérez" 
                          {...field} 
                          data-testid="input-create-lastname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-create-role">
                          <SelectValue placeholder="Seleccionar un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Employee">
                          <div className="flex items-center">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Empleado
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

              <FormField
                control={createForm.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa {isCurrentUserAdmin ? '*' : ''}</FormLabel>
                    {isCurrentUserDirector ? (
                      <FormControl>
                        <Input 
                          value={companies?.find((c: any) => c.id === (currentUser as any)?.companyId)?.name || 'Cargando...'}
                          disabled
                          data-testid="input-create-company-readonly"
                          className="bg-muted"
                        />
                      </FormControl>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-company">
                            <SelectValue placeholder="Seleccionar empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies?.map((company: any) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    createForm.reset();
                  }}
                  data-testid="button-cancel-create"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}