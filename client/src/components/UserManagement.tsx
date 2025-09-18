import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { X, Plus, Edit, Trash2, Users, Shield, Eye, UserPlus } from "lucide-react";
import type { User } from "@shared/schema";

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserFormData {
  username: string;
  password: string;
  role: string;
}

export default function UserManagement({ isOpen, onClose }: UserManagementProps) {
  const { toast } = useToast();
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    password: "",
    role: "viewer"
  });

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isOpen
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setAddUserOpen(false);
      setFormData({ username: "", password: "", role: "viewer" });
      toast({
        title: "تم إضافة المستخدم",
        description: "تم إضافة المستخدم بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المستخدم",
        variant: "destructive"
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<UserFormData> }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditUserOpen(false);
      setEditUser(null);
      setFormData({ username: "", password: "", role: "viewer" });
      toast({
        title: "تم تحديث المستخدم",
        description: "تم تحديث المستخدم بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المستخدم",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المستخدم",
        variant: "destructive"
      });
    }
  });

  const handleAddUser = () => {
    if (!formData.username || !formData.password) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }
    addUserMutation.mutate(formData);
  };

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role || "viewer"
    });
    setEditUserOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editUser) return;
    
    const updateData: Partial<UserFormData> = {
      username: formData.username,
      role: formData.role
    };
    
    // Only include password if provided
    if (formData.password.trim()) {
      updateData.password = formData.password;
    }

    updateUserMutation.mutate({ id: editUser.id, userData: updateData });
  };

  const handleDeleteUser = (id: string) => {
    deleteUserMutation.mutate(id);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><Shield className="w-3 h-3 ml-1" />مدير</Badge>;
      case 'viewer':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Eye className="w-3 h-3 ml-1" />مشاهد</Badge>;
      case 'guest':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"><Users className="w-3 h-3 ml-1" />زائر</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
      <Card className="w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground flex items-center">
              <Users className="w-6 h-6 ml-2 text-primary" />
              إدارة المستخدمين
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-close-user-management"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 max-h-[70vh] overflow-y-auto">
          {/* Add User Button */}
          <div className="mb-6">
            <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center" data-testid="button-add-user">
                  <UserPlus className="w-4 h-4 ml-2" />
                  إضافة مستخدم جديد
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">اسم المستخدم</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="اسم المستخدم"
                      data-testid="input-username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="كلمة المرور"
                      data-testid="input-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">الدور</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">مدير</SelectItem>
                        <SelectItem value="editor">محرر</SelectItem>
                        <SelectItem value="viewer">مشاهد</SelectItem>
                        <SelectItem value="guest">زائر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleAddUser} 
                      disabled={addUserMutation.isPending}
                      data-testid="button-save-user"
                    >
                      {addUserMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setAddUserOpen(false)}
                      data-testid="button-cancel-add-user"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المستخدم</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      لا يوجد مستخدمين
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium" data-testid={`text-username-${user.id}`}>
                        {user.username}
                      </TableCell>
                      <TableCell data-testid={`badge-role-${user.id}`}>
                        {getRoleBadge(user.role || "viewer")}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-created-${user.id}`}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            data-testid={`button-edit-${user.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف المستخدم "{user.username}"؟ هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-${user.id}`}
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Edit User Dialog */}
        <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل المستخدم</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">اسم المستخدم</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="اسم المستخدم"
                  data-testid="input-edit-username"
                />
              </div>
              <div>
                <Label htmlFor="edit-password">كلمة المرور الجديدة (اتركها فارغة إذا لم تريد تغييرها)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="كلمة المرور الجديدة"
                  data-testid="input-edit-password"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">الدور</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger data-testid="select-edit-role">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير</SelectItem>
                    <SelectItem value="viewer">مشاهد</SelectItem>
                    <SelectItem value="guest">زائر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateUser} 
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save-edit-user"
                >
                  {updateUserMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditUserOpen(false)}
                  data-testid="button-cancel-edit-user"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}