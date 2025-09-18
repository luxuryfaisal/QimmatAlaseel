import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "../components/AuthModal";
import NoteModal from "../components/NoteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Save, FileText, Printer, LogOut, User, Calendar, Package, ShoppingCart, Clock } from "lucide-react";
import type { Order, Note } from "@shared/schema";

declare global {
  interface Window {
    html2pdf: any;
  }
}

export default function OrderTracker() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [currentNote, setCurrentNote] = useState("");

  // Check authentication on mount
  useEffect(() => {
    const authData = localStorage.getItem('orderTrackerAuth');
    if (authData) {
      const { username, timestamp } = JSON.parse(authData);
      const hoursSinceLogin = (Date.now() - timestamp) / (1000 * 60 * 60);
      
      if (hoursSinceLogin < 24) {
        setIsAuthenticated(true);
        setCurrentUser(username);
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

  const handleLogin = (username: string) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
    localStorage.setItem('orderTrackerAuth', JSON.stringify({
      username,
      timestamp: Date.now()
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('orderTrackerAuth');
    setIsAuthenticated(false);
    setCurrentUser('');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل الخروج بنجاح"
    });
  };

  const handleAddRow = () => {
    createOrderMutation.mutate({
      orderNumber: `ORD-${Date.now()}`,
      partNumber: "",
      lastInquiry: "",
      status: "قيد المراجعة"
    });
  };

  const handleUpdateOrder = (orderId: string, field: keyof Order, value: string) => {
    updateOrderMutation.mutate({ id: orderId, [field]: value });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleOpenNoteModal = (orderId: string) => {
    setCurrentOrderId(orderId);
    const orderNote = allNotes.find((note: Note) => note.orderId === orderId);
    setCurrentNote(orderNote?.content || "");
    setNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    const existingNote = allNotes.find((note: Note) => note.orderId === currentOrderId);
    
    if (existingNote) {
      updateNoteMutation.mutate({ id: existingNote.id, content: currentNote });
    } else if (currentNote.trim()) {
      createNoteMutation.mutate({ orderId: currentOrderId, content: currentNote });
    }
    
    setNoteModalOpen(false);
    setCurrentOrderId("");
    setCurrentNote("");
  };

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

  if (!isAuthenticated) {
    return <AuthModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="auth-gradient w-10 h-10 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">نظام إدارة تتبع الطلبات</h1>
                <p className="text-sm text-muted-foreground">فيصل - قسم الكهرباء</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex items-center space-x-reverse space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  مرحباً، <span className="font-medium text-foreground">{currentUser}</span>
                </span>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 ml-1" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Status Bar */}
        <Card className="p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-reverse space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground" data-testid="text-total-orders">{totalOrders}</div>
                <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold status-pending" data-testid="text-pending-orders">{pendingOrders}</div>
                <div className="text-sm text-muted-foreground">قيد المراجعة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold status-received" data-testid="text-completed-orders">{completedOrders}</div>
                <div className="text-sm text-muted-foreground">مكتملة</div>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 ml-1" />
              آخر تحديث: <span data-testid="text-last-update">منذ دقيقتين</span>
            </div>
          </div>
        </Card>

        {/* Order Table */}
        <Card className="shadow-sm overflow-hidden" id="table-container">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">جدول تتبع الطلبات</h2>
              <Button 
                onClick={handleAddRow} 
                disabled={createOrderMutation.isPending}
                data-testid="button-add-row"
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-1" />
                ) : (
                  <Plus className="w-4 h-4 ml-1" />
                )}
                إضافة صف جديد
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
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
                            data-testid={`input-date-${order.id}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="link"
                            className="text-primary hover:text-primary/80 underline p-0 h-auto"
                            onClick={() => handleOpenNoteModal(order.id)}
                            data-testid={`button-note-${order.id}`}
                          >
                            {orderNote ? 'عرض الملاحظة' : 'للتفاصيل اضغط هنا'}
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            type="text"
                            value={order.partNumber || ""}
                            onChange={(e) => handleUpdateOrder(order.id, 'partNumber', e.target.value)}
                            className="bg-transparent border-none rtl-input focus:ring-0"
                            placeholder="رقم القطعة"
                            data-testid={`input-part-${order.id}`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            type="text"
                            value={order.orderNumber}
                            onChange={(e) => handleUpdateOrder(order.id, 'orderNumber', e.target.value)}
                            className="bg-transparent border-none rtl-input focus:ring-0"
                            data-testid={`input-order-${order.id}`}
                          />
                        </td>
                        <td className="px-6 py-4 no-print">
                          <Button
                            variant="link"
                            size="sm"
                            className="text-destructive hover:text-destructive/80 p-0 h-auto"
                            onClick={() => handleDeleteOrder(order.id)}
                            data-testid={`button-delete-${order.id}`}
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
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center no-print">
          <Button 
            onClick={() => refetch()}
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
          setCurrentNote("");
        }}
        onSave={handleSaveNote}
        orderId={currentOrderId}
        note={currentNote}
        onNoteChange={setCurrentNote}
      />
    </div>
  );
}
