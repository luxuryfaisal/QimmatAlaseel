import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import AuthModal from "../components/AuthModal";
import NoteModal from "../components/NoteModal";
import AttachmentModal from "../components/AttachmentModal";
import ModernHeader from "../components/ModernHeader";
import UserManagement from "../components/UserManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Save, FileText, Printer, LogOut, User as UserIcon, Calendar, Package, ShoppingCart, Clock, Settings, CheckSquare, AlertTriangle, Bell } from "lucide-react";
import type { Order, Note, TaskNote, Task, User } from "@shared/schema";

declare global {
  interface Window {
    html2pdf: any;
  }
}

export default function OrderTracker() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [currentNote, setCurrentNote] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState<string>("");
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [currentAttachmentTaskId, setCurrentAttachmentTaskId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"orders" | "tasks">("orders");
  const [taskAlertsShown, setTaskAlertsShown] = useState(false);
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const authData = localStorage.getItem('orderTrackerAuth');
    if (authData) {
      const { username, role, timestamp } = JSON.parse(authData);
      const hoursSinceLogin = (Date.now() - timestamp) / (1000 * 60 * 60);
      
      if (hoursSinceLogin < 24 && role) {
        setIsAuthenticated(true);
        setCurrentUser(username);
        setUserRole(role);
      } else {
        // Clear invalid or old sessions
        localStorage.removeItem('orderTrackerAuth');
      }
    }

    // Check PIN authentication
    const pinAuthData = localStorage.getItem('tasksPinAuth');
    if (pinAuthData) {
      const { authenticated, timestamp } = JSON.parse(pinAuthData);
      const hoursAgo = (Date.now() - timestamp) / (1000 * 60 * 60);
      
      if (authenticated && hoursAgo < 2) { // PIN valid for 2 hours
        setIsPinAuthenticated(true);
      } else {
        localStorage.removeItem('tasksPinAuth');
      }
    }
  }, []);

  // Fetch orders
  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: isAuthenticated
  });

  // Fetch notes for all orders
  const { data: allNotes = [] } = useQuery({
    queryKey: ['/api/orders/notes'],
    queryFn: async () => {
      if (!orders.length) return [];
      
      const notesPromises = orders.map((order: Order) => 
        fetch(`/api/orders/${order.id}/notes`).then(res => res.json())
      );
      
      const notesArrays = await Promise.all(notesPromises);
      return notesArrays.flat();
    },
    enabled: isAuthenticated && orders.length > 0
  });

  // Fetch tasks first
  const { data: tasks = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: isAuthenticated
  });

  // Fetch notes for all tasks
  const { data: allTaskNotes = [] } = useQuery({
    queryKey: ['/api/tasks/notes'],
    queryFn: async () => {
      if (!tasks.length) return [];
      
      const notesPromises = tasks.map((task: Task) => 
        fetch(`/api/tasks/${task.id}/notes`).then(res => res.json())
      );
      
      const notesArrays = await Promise.all(notesPromises);
      return notesArrays.flat();
    },
    enabled: isAuthenticated && tasks.length > 0
  });

  // Fetch attachments for all tasks
  const { data: allTaskAttachments = [] } = useQuery({
    queryKey: ['/api/tasks/attachments'],
    queryFn: async () => {
      if (!tasks.length) return [];
      
      const attachmentsPromises = tasks.map((task: Task) => 
        fetch(`/api/tasks/${task.id}/attachments`).then(res => res.json())
      );
      
      const attachmentsArrays = await Promise.all(attachmentsPromises);
      return attachmentsArrays.flat();
    },
    enabled: isAuthenticated && tasks.length > 0
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "تم إضافة الطلب بنجاح",
        description: "تم إنشاء صف جديد في الجدول"
      });
    }
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Order>) => {
      const response = await apiRequest('PUT', `/api/orders/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/orders/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "تم حذف الطلب",
        description: "تم حذف الصف بنجاح"
      });
    }
  });

  // Note mutations
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { orderId: string; content: string }) => {
      const response = await apiRequest('POST', '/api/notes', noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/notes'] });
      toast({
        title: "تم حفظ الملاحظة",
        description: "تم حفظ الملاحظة بنجاح"
      });
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await apiRequest('PUT', `/api/notes/${id}`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/notes'] });
      toast({
        title: "تم تحديث الملاحظة",
        description: "تم تحديث الملاحظة بنجاح"
      });
    }
  });

  // Task note mutations
  const createTaskNoteMutation = useMutation({
    mutationFn: async (noteData: { taskId: string; content: string }) => {
      const response = await apiRequest('POST', '/api/task-notes', noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/notes'] });
      toast({
        title: "تم حفظ ملاحظة المهمة",
        description: "تم حفظ ملاحظة المهمة بنجاح"
      });
    }
  });

  const updateTaskNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await apiRequest('PUT', `/api/task-notes/${id}`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/notes'] });
      toast({
        title: "تم تحديث ملاحظة المهمة",
        description: "تم تحديث ملاحظة المهمة بنجاح"
      });
    }
  });

  // Attachment mutations
  const createAttachmentMutation = useMutation({
    mutationFn: async (attachmentData: { taskId: string; filename: string; mimeType: string; dataBase64: string; size: string }) => {
      const response = await apiRequest('POST', '/api/attachments', attachmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/attachments'] });
      toast({
        title: "تم رفع المرفق",
        description: "تم رفع المرفق بنجاح"
      });
    }
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/attachments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/attachments'] });
      toast({
        title: "تم حذف المرفق",
        description: "تم حذف المرفق بنجاح"
      });
    }
  });


  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const response = await apiRequest('POST', '/api/tasks', taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "تم إضافة المهمة بنجاح",
        description: "تم إنشاء مهمة جديدة في الجدول"
      });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Task>) => {
      const response = await apiRequest('PUT', `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/tasks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "تم حذف المهمة",
        description: "تم حذف المهمة بنجاح"
      });
    }
  });

  // User interface imported from shared schema

  const handleLogin = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user.username || '');
    setUserRole(user.role || 'viewer');
    localStorage.setItem('orderTrackerAuth', JSON.stringify({
      username: user.username || '',
      role: user.role || 'viewer',
      timestamp: Date.now()
    }));
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint to destroy server session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear client-side data
    localStorage.removeItem('orderTrackerAuth');
    localStorage.removeItem('tasksPinAuth'); // Clear PIN session on logout
    setIsAuthenticated(false);
    setCurrentUser('');
    setUserRole('');
    setIsPinAuthenticated(false); // Reset PIN authentication
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل الخروج بنجاح"
    });
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  // Permission helpers
  const canEdit = () => userRole === 'admin';
  const canDelete = () => userRole === 'admin';
  const isGuest = () => userRole === 'guest';

  // PIN handlers
  const handleTabChange = (tab: "orders" | "tasks") => {
    if (tab === "tasks" && !isPinAuthenticated) {
      setPinModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handlePinSubmit = () => {
    const correctPin = "1234"; // This could be configurable in the future
    if (pinInput === correctPin) {
      setIsPinAuthenticated(true);
      localStorage.setItem('tasksPinAuth', JSON.stringify({
        authenticated: true,
        timestamp: Date.now()
      }));
      setPinModalOpen(false);
      setPinInput("");
      setActiveTab("tasks");
      toast({
        title: "تم التحقق بنجاح",
        description: "تم فتح قسم إدارة المهام"
      });
    } else {
      toast({
        variant: "destructive",
        title: "PIN خاطئ",
        description: "يرجى إدخال PIN صحيح"
      });
    }
  };

  const handlePinModalClose = () => {
    setPinModalOpen(false);
    setPinInput("");
  };

  const handleAddRow = () => {
    if (!canEdit()) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا تملك صلاحية إضافة طلبات جديدة"
      });
      return;
    }
    createOrderMutation.mutate({
      orderNumber: `ORD-${Date.now()}`,
      partNumber: "",
      lastInquiry: "",
      status: "قيد المراجعة"
    });
  };

  const handleUpdateOrder = (orderId: string, field: keyof Order, value: string) => {
    if (!canEdit()) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا تملك صلاحية تعديل الطلبات"
      });
      return;
    }
    updateOrderMutation.mutate({ id: orderId, [field]: value });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!canDelete()) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا تملك صلاحية حذف الطلبات"
      });
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleOpenNoteModal = (orderId: string) => {
    setCurrentOrderId(orderId);
    setCurrentTaskId(""); // Clear task ID
    const orderNote = allNotes.find((note: Note) => note.orderId === orderId);
    setCurrentNote(orderNote?.content || "");
    setNoteModalOpen(true);
  };

  const handleOpenTaskNoteModal = (taskId: string) => {
    setCurrentTaskId(taskId);
    setCurrentOrderId(""); // Clear order ID
    const taskNote = allTaskNotes.find((note: TaskNote) => note.taskId === taskId);
    setCurrentNote(taskNote?.content || "");
    setNoteModalOpen(true);
  };

  const handleOpenAttachmentModal = (taskId: string) => {
    setCurrentAttachmentTaskId(taskId);
    setAttachmentModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!canEdit()) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا تملك صلاحية حفظ الملاحظات"
      });
      return;
    }

    // Handle order notes
    if (currentOrderId) {
      const existingNote = allNotes.find((note: Note) => note.orderId === currentOrderId);
      
      if (existingNote) {
        updateNoteMutation.mutate({ id: existingNote.id, content: currentNote });
      } else if (currentNote.trim()) {
        createNoteMutation.mutate({ orderId: currentOrderId, content: currentNote });
      }
    }
    
    // Handle task notes
    if (currentTaskId) {
      const existingNote = allTaskNotes.find((note: TaskNote) => note.taskId === currentTaskId);
      
      if (existingNote) {
        updateTaskNoteMutation.mutate({ id: existingNote.id, content: currentNote });
      } else if (currentNote.trim()) {
        createTaskNoteMutation.mutate({ taskId: currentTaskId, content: currentNote });
      }
    }
    
    setNoteModalOpen(false);
    setCurrentOrderId("");
    setCurrentTaskId("");
    setCurrentNote("");
  };

  // Task handlers
  const handleAddTask = () => {
    if (!canEdit()) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا تملك صلاحية إضافة مهام جديدة"
      });
      return;
    }
    createTaskMutation.mutate({
      taskName: `مهمة جديدة - ${Date.now()}`,
      taskType: "",
      lastInquiry: "",
      taskStatus: "قيد المراجعة",
      dueDate: ""
    });
  };

  const handleUpdateTask = (taskId: string, field: keyof Task, value: string) => {
    if (!canEdit()) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا تملك صلاحية تعديل المهام"
      });
      return;
    }
    updateTaskMutation.mutate({ id: taskId, [field]: value });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!canDelete()) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا تملك صلاحية حذف المهام"
      });
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // Task reminder functionality with timezone-safe date parsing
  const getTaskUrgencyLevel = (dueDate: string | null) => {
    if (!dueDate) return 'none';
    
    // Parse dates to local midnight to avoid timezone issues
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueMidnight = parseLocalDate(dueDate);
    
    const diffTime = dueMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'due-today';
    if (diffDays <= 3) return 'due-soon';
    return 'normal';
  };

  const getTaskRowClassName = (urgencyLevel: string) => {
    const baseClass = "hover:bg-accent/50 transition-colors duration-200";
    switch (urgencyLevel) {
      case 'overdue':
        return `${baseClass} bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800`;
      case 'due-today':
        return `${baseClass} bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800`;
      case 'due-soon':
        return `${baseClass} bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800`;
      default:
        return baseClass;
    }
  };

  const getUrgencyIcon = (urgencyLevel: string, taskId: string) => {
    switch (urgencyLevel) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500 ml-1" data-testid={`icon-overdue-${taskId}`} aria-label="مهمة متأخرة" />;
      case 'due-today':
        return <Bell className="w-4 h-4 text-orange-500 ml-1" data-testid={`icon-due-today-${taskId}`} aria-label="مهمة مستحقة اليوم" />;
      case 'due-soon':
        return <Clock className="w-4 h-4 text-yellow-500 ml-1" data-testid={`icon-due-soon-${taskId}`} aria-label="مهمة مستحقة قريباً" />;
      default:
        return null;
    }
  };

  // Check for urgent tasks and show toast notifications only on login
  useEffect(() => {
    if (isAuthenticated && tasks.length > 0 && !taskAlertsShown) {
      const overdueTasks = tasks.filter(task => getTaskUrgencyLevel(task.dueDate) === 'overdue');
      const dueTodayTasks = tasks.filter(task => getTaskUrgencyLevel(task.dueDate) === 'due-today');
      
      if (overdueTasks.length > 0) {
        toast({
          title: "⚠️ مهام متأخرة",
          description: `لديك ${overdueTasks.length} مهام متأخرة عن موعد الاستحقاق`,
          variant: "destructive"
        });
        setTaskAlertsShown(true);
      } else if (dueTodayTasks.length > 0) {
        toast({
          title: "📅 مهام مستحقة اليوم",
          description: `لديك ${dueTodayTasks.length} مهام مستحقة اليوم`,
        });
        setTaskAlertsShown(true);
      }
    }
  }, [isAuthenticated, tasks, taskAlertsShown, toast]);

  const handleExportPDF = () => {
    const element = document.getElementById('table-container');
    if (!element) return;

    const options = {
      margin: 1,
      filename: `تتبع_الطلبات_${new Date().toLocaleDateString('ar')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    window.html2pdf().from(element).set(options).save();
    toast({
      title: "تم تصدير PDF",
      description: "تم تصدير الجدول بصيغة PDF بنجاح"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o: Order) => o.status?.includes('قيد') || !o.status).length;
  const completedOrders = totalOrders - pendingOrders;

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t: Task) => t.taskStatus?.includes('قيد') || !t.taskStatus).length;
  const completedTasks = totalTasks - pendingTasks;

  if (!isAuthenticated) {
    return <AuthModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Modern Header */}
      <ModernHeader
        username={currentUser}
        userRole={userRole}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
        isDarkMode={theme === "dark"}
        onToggleDarkMode={toggleTheme}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === "orders"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="tab-orders"
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              قسم طلبات الكهرباء
            </button>
            <button
              onClick={() => handleTabChange("tasks")}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === "tasks"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="tab-tasks"
            >
              <CheckSquare className="w-4 h-4 ml-2" />
              قسم إدارة المهام
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <Card className="p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-reverse space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground" data-testid={activeTab === "orders" ? "text-total-orders" : "text-total-tasks"}>
                  {activeTab === "orders" ? totalOrders : totalTasks}
                </div>
                <div className="text-sm text-muted-foreground">
                  {activeTab === "orders" ? "إجمالي الطلبات" : "إجمالي المهام"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold status-pending" data-testid={activeTab === "orders" ? "text-pending-orders" : "text-pending-tasks"}>
                  {activeTab === "orders" ? pendingOrders : pendingTasks}
                </div>
                <div className="text-sm text-muted-foreground">قيد المراجعة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold status-received" data-testid={activeTab === "orders" ? "text-completed-orders" : "text-completed-tasks"}>
                  {activeTab === "orders" ? completedOrders : completedTasks}
                </div>
                <div className="text-sm text-muted-foreground">مكتملة</div>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 ml-1" />
              آخر تحديث: <span data-testid="text-last-update">منذ دقيقتين</span>
            </div>
          </div>
        </Card>

        {/* Tables Section */}
        <Card className="shadow-sm overflow-hidden" id="table-container">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {activeTab === "orders" ? "جدول تتبع الطلبات" : "جدول إدارة المهام"}
              </h2>
              <Button 
                onClick={activeTab === "orders" ? handleAddRow : handleAddTask} 
                disabled={!canEdit() || (activeTab === "orders" ? createOrderMutation.isPending : createTaskMutation.isPending)}
                data-testid={activeTab === "orders" ? "button-add-row" : "button-add-task"}
              >
                {(activeTab === "orders" ? createOrderMutation.isPending : createTaskMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-1" />
                ) : (
                  <Plus className="w-4 h-4 ml-1" />
                )}
                {activeTab === "orders" ? "إضافة صف جديد" : "إضافة مهمة جديدة"}
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {activeTab === "orders" ? (
              <table className="w-full order-table">
                <thead className="bg-primary">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <Calendar className="w-4 h-4 inline ml-1" />
                      تاريخ آخر استفسار
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <FileText className="w-4 h-4 inline ml-1" />
                      حالة الطلب
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <Package className="w-4 h-4 inline ml-1" />
                      رقم القطعة
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <ShoppingCart className="w-4 h-4 inline ml-1" />
                      رقم الطلب
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground no-print">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <div className="text-muted-foreground">جاري تحميل الطلبات...</div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        لا توجد طلبات حالياً
                      </td>
                    </tr>
                  ) : (
                    orders.map((order: Order) => {
                      const orderNote = allNotes.find((note: Note) => note.orderId === order.id);
                      return (
                        <tr key={order.id} className="hover:bg-accent/50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <Input
                              type="date"
                              value={order.lastInquiry || ""}
                              onChange={(e) => handleUpdateOrder(order.id, 'lastInquiry', e.target.value)}
                              className="bg-transparent border-none rtl-input focus:ring-0 cursor-pointer"
                              disabled={!canEdit()}
                              data-testid={`input-date-${order.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={order.status || ""}
                              onChange={(e) => handleUpdateOrder(order.id, 'status', e.target.value)}
                              className="bg-transparent border-none rtl-input focus:ring-0"
                              placeholder="حالة الطلب"
                              disabled={!canEdit()}
                              data-testid={`input-status-${order.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={order.partNumber || ""}
                              onChange={(e) => handleUpdateOrder(order.id, 'partNumber', e.target.value)}
                              className="bg-transparent border-none rtl-input focus:ring-0"
                              placeholder="رقم القطعة"
                              disabled={!canEdit()}
                              data-testid={`input-part-${order.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={order.orderNumber}
                              onChange={(e) => handleUpdateOrder(order.id, 'orderNumber', e.target.value)}
                              className="bg-transparent border-none rtl-input focus:ring-0"
                              disabled={!canEdit()}
                              data-testid={`input-order-${order.id}`}
                            />
                          </td>
                          <td className="px-6 py-4 no-print">
                            <div className="flex gap-2">
                              <Button
                                variant="link"
                                size="sm"
                                className="text-primary hover:text-primary/80 p-0 h-auto"
                                onClick={() => handleOpenNoteModal(order.id)}
                                data-testid={`button-note-${order.id}`}
                              >
                                {orderNote && orderNote.content && orderNote.content.trim() ? 'عرض الملاحظة' : (canEdit() ? 'ملاحظة' : 'عرض الملاحظة')}
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-destructive hover:text-destructive/80 p-0 h-auto"
                                onClick={() => handleDeleteOrder(order.id)}
                                disabled={!canDelete()}
                                data-testid={`button-delete-${order.id}`}
                              >
                                حذف
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full order-table">
                <thead className="bg-primary">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <Calendar className="w-4 h-4 inline ml-1" />
                      تاريخ الاستحقاق
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <Calendar className="w-4 h-4 inline ml-1" />
                      تاريخ آخر استفسار
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <FileText className="w-4 h-4 inline ml-1" />
                      الملاحظات
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <Package className="w-4 h-4 inline ml-1" />
                      المرفقات
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <Settings className="w-4 h-4 inline ml-1" />
                      نوع المهمة
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground">
                      <CheckSquare className="w-4 h-4 inline ml-1" />
                      اسم المهمة
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-primary-foreground no-print">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoadingTasks ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <div className="text-muted-foreground">جاري تحميل المهام...</div>
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        لا توجد مهام حالياً
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task: Task) => {
                      const urgencyLevel = getTaskUrgencyLevel(task.dueDate);
                      return (
                        <tr key={task.id} className={getTaskRowClassName(urgencyLevel)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Input
                                type="date"
                                value={task.dueDate || ""}
                                onChange={(e) => handleUpdateTask(task.id, 'dueDate', e.target.value)}
                                className="bg-transparent border-none rtl-input focus:ring-0 cursor-pointer"
                                disabled={!canEdit()}
                                data-testid={`input-due-date-${task.id}`}
                              />
                              {getUrgencyIcon(urgencyLevel, task.id)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="date"
                              value={task.lastInquiry || ""}
                              onChange={(e) => handleUpdateTask(task.id, 'lastInquiry', e.target.value)}
                              className="bg-transparent border-none rtl-input focus:ring-0 cursor-pointer"
                              disabled={!canEdit()}
                              data-testid={`input-last-inquiry-${task.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary hover:text-primary/80 p-0 h-auto"
                              onClick={() => handleOpenTaskNoteModal(task.id)}
                              data-testid={`button-task-note-${task.id}`}
                            >
                              {(() => {
                                const taskNote = allTaskNotes.find((note: TaskNote) => note.taskId === task.id);
                                return taskNote && taskNote.content && taskNote.content.trim() 
                                  ? 'عرض الملاحظة' 
                                  : (canEdit() ? 'ملاحظة' : 'عرض الملاحظة');
                              })()}
                            </Button>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary hover:text-primary/80 p-0 h-auto"
                              onClick={() => handleOpenAttachmentModal(task.id)}
                              data-testid={`button-task-attachment-${task.id}`}
                            >
                              {(() => {
                                const taskAttachments = allTaskAttachments.filter((att: any) => att.taskId === task.id);
                                return taskAttachments.length > 0 
                                  ? `مرفقات (${taskAttachments.length})` 
                                  : 'مرفقات';
                              })()}
                            </Button>
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={task.taskType || ""}
                              onChange={(e) => handleUpdateTask(task.id, 'taskType', e.target.value)}
                              className="bg-transparent border-none rtl-input focus:ring-0"
                              placeholder="نوع المهمة"
                              disabled={!canEdit()}
                              data-testid={`input-task-type-${task.id}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={task.taskName}
                              onChange={(e) => handleUpdateTask(task.id, 'taskName', e.target.value)}
                              className="bg-transparent border-none rtl-input focus:ring-0"
                              disabled={!canEdit()}
                              data-testid={`input-task-name-${task.id}`}
                            />
                          </td>
                          <td className="px-6 py-4 no-print">
                            <Button
                              variant="link"
                              size="sm"
                              className="text-destructive hover:text-destructive/80 p-0 h-auto"
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={!canDelete()}
                              data-testid={`button-delete-task-${task.id}`}
                            >
                              حذف
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center no-print">
          <Button 
            onClick={() => activeTab === "orders" ? refetch() : refetchTasks()}
            data-testid="button-save"
          >
            <Save className="w-4 h-4 ml-1" />
            تحديث البيانات
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={handleExportPDF}
            data-testid="button-export-pdf"
          >
            <FileText className="w-4 h-4 ml-1" />
            تصدير PDF
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={handlePrint}
            data-testid="button-print"
          >
            <Printer className="w-4 h-4 ml-1" />
            طباعة
          </Button>
        </div>
      </main>

      {/* Note Modal */}
      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setCurrentOrderId("");
          setCurrentTaskId("");
          setCurrentNote("");
        }}
        onSave={handleSaveNote}
        orderId={currentOrderId}
        taskId={currentTaskId}
        note={currentNote}
        onNoteChange={setCurrentNote}
      />

      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={attachmentModalOpen}
        onClose={() => {
          setAttachmentModalOpen(false);
          setCurrentAttachmentTaskId("");
        }}
        taskId={currentAttachmentTaskId}
        attachments={allTaskAttachments}
        onUpload={createAttachmentMutation.mutate}
        onDelete={deleteAttachmentMutation.mutate}
        canEdit={canEdit()}
      />

      {/* PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-center">حماية قسم المهام</h2>
            <p className="text-muted-foreground mb-4 text-center">
              يرجى إدخال PIN المكون من 4 أرقام للوصول إلى قسم إدارة المهام
            </p>
            <div className="space-y-4">
              <Input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="أدخل PIN"
                maxLength={4}
                className="text-center text-2xl tracking-widest"
                data-testid="input-pin"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePinSubmit();
                  }
                  if (e.key === 'Escape') {
                    handlePinModalClose();
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handlePinModalClose}
                  data-testid="button-pin-cancel"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handlePinSubmit}
                  disabled={pinInput.length !== 4}
                  data-testid="button-pin-submit"
                >
                  تأكيد
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      <UserManagement
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
