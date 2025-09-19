import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Moon, Sun, Clock, Calendar, NotebookPen, Camera, Plus, X, Save, Edit2, Play, Pause, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { PersonalNotes } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Safe ESM logo import with fallback  
const logos = import.meta.glob('@assets/1000063409_1758280754249.png', { 
  eager: true, 
  query: '?url',
  import: 'default'
});
const logoUrl = Object.values(logos)[0] as string | undefined;

// Log warning only if asset is missing (avoid noise during HMR)
if (!logoUrl && !(window as any).__logoWarningShown) {
  console.warn('Logo asset not found, will use fallback');
  (window as any).__logoWarningShown = true;
}

// Fallback logo component (hoisted to avoid recreation on each render)
const LogoFallback = () => (
  <div 
    className="h-16 w-16 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-xl"
    data-testid="img-company-logo-fallback"
  >
    ق
  </div>
);

interface ModernHeaderProps {
  username: string;
  userRole: string;
  onLogout: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function ModernHeader({ 
  username, 
  userRole, 
  onLogout, 
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode 
}: ModernHeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageError, setImageError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [activeNoteTab, setActiveNoteTab] = useState("tab1");
  const [adminProfilePics, setAdminProfilePics] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [profilePicDialogOpen, setProfilePicDialogOpen] = useState(false);
  const [isImageRotationPaused, setIsImageRotationPaused] = useState(false);
  const [imageTransitioning, setImageTransitioning] = useState(false);
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [tempTabName, setTempTabName] = useState("");
  const [themeColorDialogOpen, setThemeColorDialogOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');

  // Fetch personal notes only when user is logged in and not opening dialog
  const { data: personalNotes, isLoading: notesLoading } = useQuery<PersonalNotes>({
    queryKey: ['/api/personal-notes'],
    enabled: !!username && username !== 'زائر' && notesDialogOpen, // Only fetch when dialog opens and user is logged in
    retry: 1, // Limited retry for better error handling
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false // Don't refetch on window focus
  });

  // Create/Update personal notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: Partial<PersonalNotes>) => {
      return apiRequest('PUT', '/api/personal-notes', notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes'] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الملاحظات بنجاح"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في حفظ الملاحظات"
      });
    }
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved profile pics from localStorage
  useEffect(() => {
    const savedProfilePics = localStorage.getItem('adminProfilePics');
    if (savedProfilePics) {
      try {
        const parsedPics = JSON.parse(savedProfilePics);
        if (Array.isArray(parsedPics) && parsedPics.length > 0) {
          setAdminProfilePics(parsedPics);
        }
      } catch (error) {
        console.error('Failed to parse saved profile pictures', error);
      }
    }
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && savedTheme !== 'default') {
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Auto-rotate images every 5 seconds with pause functionality
  useEffect(() => {
    if (adminProfilePics.length > 1 && !isImageRotationPaused) {
      const interval = setInterval(() => {
        setImageTransitioning(true);
        setTimeout(() => {
          setCurrentImageIndex((prevIndex) => 
            (prevIndex + 1) % adminProfilePics.length
          );
          setImageTransitioning(false);
        }, 200); // Fade out duration
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [adminProfilePics.length, isImageRotationPaused]);

  // Helper functions for personal notes
  const saveNotes = () => {
    setNotesDialogOpen(false);
  };

  const updateTabContent = (tabKey: 'tab1Content' | 'tab2Content' | 'tab3Content', content: string) => {
    // Only update if user is logged in
    if (username && username !== 'زائر') {
      updateNotesMutation.mutate({ [tabKey]: content });
    }
  };

  const updateTabName = (tabKey: 'tab1Name' | 'tab2Name' | 'tab3Name', name: string) => {
    // Only update if user is logged in
    if (username && username !== 'زائر') {
      updateNotesMutation.mutate({ [tabKey]: name });
    }
  };

  const handleTabNameEdit = (tabName: string) => {
    setEditingTabName(tabName);
    const currentName = personalNotes?.[tabName as keyof PersonalNotes] as string || "";
    setTempTabName(currentName);
  };

  const saveTabName = () => {
    if (editingTabName && tempTabName.trim()) {
      updateTabName(editingTabName as 'tab1Name' | 'tab2Name' | 'tab3Name', tempTabName.trim());
    }
    setEditingTabName(null);
    setTempTabName("");
  };

  const cancelTabNameEdit = () => {
    setEditingTabName(null);
    setTempTabName("");
  };

  const handleProfilePicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        console.warn('Please select a valid image file');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.warn('Image file is too large. Please select a smaller image.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newPics = [...adminProfilePics, result];
        setAdminProfilePics(newPics);
        try {
          localStorage.setItem('adminProfilePics', JSON.stringify(newPics));
          setProfilePicDialogOpen(false);
        } catch (error) {
          console.error('Failed to save profile picture', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAllProfilePics = () => {
    setAdminProfilePics([]);
    setCurrentImageIndex(0);
    localStorage.removeItem('adminProfilePics');
    setProfilePicDialogOpen(false);
  };

  // Theme switching functions
  const applyTheme = (themeName: string) => {
    setCurrentTheme(themeName);
    if (themeName === 'default') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('selectedTheme');
    } else {
      document.documentElement.setAttribute('data-theme', themeName);
      localStorage.setItem('selectedTheme', themeName);
    }
    setThemeColorDialogOpen(false);
  };

  const availableThemes = [
    { id: 'default', name: 'الافتراضي', colors: ['#3B82F6', '#8B5CF6'] },
    { id: 'ocean', name: 'المحيط', colors: ['#0EA5E9', '#06B6D4'] },
    { id: 'sunset', name: 'غروب الشمس', colors: ['#F97316', '#EF4444'] },
    { id: 'forest', name: 'الغابة', colors: ['#22C55E', '#16A34A'] },
    { id: 'royal', name: 'ملكي', colors: ['#8B5CF6', '#FFD700'] },
    { id: 'rose', name: 'وردي', colors: ['#EC4899', '#F43F5E'] }
  ];

  // Format time in Arabic (12-hour format for Saudi Arabia)
  const formatTimeArabic = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Get Hijri and Gregorian dates
  const getFormattedDates = () => {
    // Explicitly format Gregorian date with Gregorian calendar and Arabic numerals
    const gregorianDate = currentTime.toLocaleDateString('ar-u-ca-gregory-nu-arab', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    try {
      // Use Intl.DateTimeFormat for Islamic calendar in Arabic
      const hijriFormatted = currentTime.toLocaleDateString('ar-u-ca-islamic-nu-arab', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return { gregorianDate, hijriFormatted };
    } catch (error) {
      console.warn('Hijri date formatting failed, hiding Hijri date', error);
      // Return null for hijri if formatting fails
      return { gregorianDate, hijriFormatted: null };
    }
  };

  const { gregorianDate, hijriFormatted } = getFormattedDates();

  return (
    <div className="relative overflow-hidden">
      {/* Dynamic Theme Background Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, var(--header-from) 0%, var(--header-to) 100%)`
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-4 left-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gold-500/20 rounded-full blur-lg"></div>
      </div>
      
      {/* Header Content */}
      <div className="relative px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          {/* Logo and Company Name */}
          <div className="flex items-center space-x-reverse space-x-4">
            {logoUrl && !imageError ? (
              <img 
                src={logoUrl} 
                alt="شعار شركة قمة الأصيل للعقارات" 
                className="h-16 w-auto object-contain"
                data-testid="img-company-logo"
                onError={() => setImageError(true)}
              />
            ) : (
              <LogoFallback />
            )}
            <div className="text-right">
              <h1 className="text-3xl font-bold text-white mb-1" data-testid="text-company-name">
                شركة قمة الأصيل
              </h1>
              <p className="text-blue-200 text-sm font-medium">
                نظام إدارة المشاريع والمتابعة
              </p>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-reverse space-x-4">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDarkMode}
              className="text-white hover:bg-white/10"
              data-testid="button-toggle-dark-mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Theme Colors */}
            <Dialog open={themeColorDialogOpen} onOpenChange={setThemeColorDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  data-testid="button-theme-colors"
                >
                  <Palette className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" data-testid="dialog-theme-colors">
                <DialogHeader>
                  <DialogTitle className="text-right text-xl">اختيار ألوان الموقع</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-right text-muted-foreground">اختر لوحة الألوان المفضلة لك لتخصيص شكل الموقع</p>
                  <div className="grid grid-cols-2 gap-4">
                    {availableThemes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => applyTheme(theme.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                          currentTheme === theme.id
                            ? 'border-primary shadow-lg bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        data-testid={`theme-${theme.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-right">{theme.name}</span>
                          {currentTheme === theme.id && (
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                          )}
                        </div>
                        <div className="flex space-x-reverse space-x-2">
                          {theme.colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => setThemeColorDialogOpen(false)} variant="outline" data-testid="button-close-theme-dialog">
                      إغلاق
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              className="text-white hover:bg-white/10"
              data-testid="button-header-settings"
            >
              <Settings className="w-5 h-5 ml-2" />
              إعدادات
            </Button>

            {/* User Info */}
            <div className="text-right text-white">
              <div className="flex items-center mb-1">
                <User className="w-4 h-4 ml-1" />
                <span className="font-semibold" data-testid="text-username-header">{username}</span>
              </div>
              <span className="text-xs text-blue-200" data-testid="text-user-role-header">
                {userRole === 'admin' ? 'مدير النظام' : 
                 userRole === 'editor' ? 'محرر' : 
                 userRole === 'viewer' ? 'مشاهد' : 
                 userRole === 'guest' ? 'زائر' : 'مستخدم'}
              </span>
            </div>

            {/* Logout */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onLogout}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              data-testid="button-logout-header"
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Header Information Cards */}
        <div className="grid grid-cols-4 gap-4">
          {/* Enhanced Current Time Card */}
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-xl p-6 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300" data-testid="card-current-time">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 rounded-full p-2 ml-2">
                <Clock className="w-6 h-6 text-yellow-300 drop-shadow-lg" />
              </div>
              <span className="text-lg font-semibold text-blue-100">الساعة الآن</span>
            </div>
            <div className="text-3xl font-bold text-white drop-shadow-lg tracking-wider" data-testid="text-current-time">
              {formatTimeArabic(currentTime)}
            </div>
            <div className="mt-2 h-1 w-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mx-auto"></div>
          </div>

          {/* Enhanced Date Card */}
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-xl p-6 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300" data-testid="card-dates">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 rounded-full p-2 ml-2">
                <Calendar className="w-6 h-6 text-green-300 drop-shadow-lg" />
              </div>
              <span className="text-lg font-semibold text-blue-100">التاريخ</span>
            </div>
            <div className="space-y-2">
              {hijriFormatted && (
                <div className="text-sm text-white font-medium bg-white/10 rounded-lg p-2" data-testid="text-hijri-date">
                  <span className="text-yellow-300">هـ:</span> {hijriFormatted}
                </div>
              )}
              <div className="text-sm text-white font-medium bg-white/10 rounded-lg p-2" data-testid="text-gregorian-date">
                <span className="text-green-300">م:</span> {gregorianDate}
              </div>
            </div>
            <div className="mt-3 h-1 w-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mx-auto"></div>
          </div>

          {/* Notes Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center" data-testid="card-notes">
            <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full h-full flex flex-col items-center justify-center hover:bg-white/5 rounded transition-colors" data-testid="button-open-notes">
                  <div className="flex items-center justify-center mb-2">
                    <NotebookPen className="w-5 h-5 text-blue-200 ml-2" />
                    <span className="text-sm text-blue-200">دفتر الملاحظات</span>
                  </div>
                  <div className="text-xs text-white">اضغط للفتح</div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="dialog-notes">
                <DialogHeader>
                  <DialogTitle className="text-right">دفتر الملاحظات</DialogTitle>
                </DialogHeader>
                <Tabs value={activeNoteTab} onValueChange={setActiveNoteTab} className="w-full" dir="rtl">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tab1" data-testid="tab-note1" className="relative">
                      {editingTabName === "tab1Name" ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={tempTabName}
                            onChange={(e) => setTempTabName(e.target.value)}
                            className="h-6 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveTabName();
                              if (e.key === 'Escape') cancelTabNameEdit();
                            }}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveTabName} className="h-6 w-6 p-0">
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelTabNameEdit} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>{personalNotes?.tab1Name || "ملاحظة 1"}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTabNameEdit("tab1Name")}
                            className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="tab2" data-testid="tab-note2" className="relative">
                      {editingTabName === "tab2Name" ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={tempTabName}
                            onChange={(e) => setTempTabName(e.target.value)}
                            className="h-6 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveTabName();
                              if (e.key === 'Escape') cancelTabNameEdit();
                            }}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveTabName} className="h-6 w-6 p-0">
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelTabNameEdit} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>{personalNotes?.tab2Name || "ملاحظة 2"}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTabNameEdit("tab2Name")}
                            className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="tab3" data-testid="tab-note3" className="relative">
                      {editingTabName === "tab3Name" ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={tempTabName}
                            onChange={(e) => setTempTabName(e.target.value)}
                            className="h-6 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveTabName();
                              if (e.key === 'Escape') cancelTabNameEdit();
                            }}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveTabName} className="h-6 w-6 p-0">
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelTabNameEdit} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>{personalNotes?.tab3Name || "ملاحظة 3"}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTabNameEdit("tab3Name")}
                            className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="tab1" className="space-y-4">
                    <Textarea 
                      placeholder="اكتب ملاحظاتك هنا..."
                      className="min-h-[200px] text-right"
                      value={personalNotes?.tab1Content || ""}
                      onChange={(e) => updateTabContent('tab1Content', e.target.value)}
                      data-testid="textarea-note1"
                    />
                  </TabsContent>
                  <TabsContent value="tab2" className="space-y-4">
                    <Textarea 
                      placeholder="اكتب ملاحظاتك هنا..."
                      className="min-h-[200px] text-right"
                      value={personalNotes?.tab2Content || ""}
                      onChange={(e) => updateTabContent('tab2Content', e.target.value)}
                      data-testid="textarea-note2"
                    />
                  </TabsContent>
                  <TabsContent value="tab3" className="space-y-4">
                    <Textarea 
                      placeholder="اكتب ملاحظاتك هنا..."
                      className="min-h-[200px] text-right"
                      value={personalNotes?.tab3Content || ""}
                      onChange={(e) => updateTabContent('tab3Content', e.target.value)}
                      data-testid="textarea-note3"
                    />
                  </TabsContent>
                </Tabs>
                <div className="flex justify-end space-x-reverse space-x-2">
                  <Button onClick={() => setNotesDialogOpen(false)} variant="outline" data-testid="button-cancel-notes">
                    إلغاء
                  </Button>
                  <Button onClick={saveNotes} data-testid="button-save-notes">
                    <Save className="w-4 h-4 ml-2" />
                    حفظ
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Enhanced Admin Profile Picture Card with Multiple Rotating Images */}
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-xl overflow-hidden shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300" data-testid="card-admin-profile">
            {adminProfilePics.length > 0 ? (
              <div className="relative w-full h-full group">
                <div 
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => setIsImageRotationPaused(!isImageRotationPaused)}
                  data-testid="img-container-admin-profile"
                >
                  <img 
                    src={adminProfilePics[currentImageIndex]} 
                    alt={`صورة المدير`} 
                    className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${
                      imageTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                    }`}
                    data-testid="img-admin-profile"
                  />
                  
                  {/* Pause/Play indicator */}
                  {adminProfilePics.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/60 backdrop-blur-sm rounded-full p-3">
                        {isImageRotationPaused ? (
                          <Play className="w-6 h-6 text-white" />
                        ) : (
                          <Pause className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Navigation dots */}
                {adminProfilePics.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {adminProfilePics.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === currentImageIndex 
                            ? 'bg-white scale-125' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                        data-testid={`dot-${index}`}
                      />
                    ))}
                  </div>
                )}
                
                {userRole === 'admin' && (
                  <Dialog open={profilePicDialogOpen} onOpenChange={setProfilePicDialogOpen}>
                    <DialogTrigger asChild>
                      <button 
                        className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100" 
                        data-testid="button-admin-profile"
                      >
                        <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-admin-profile">
                      <DialogHeader>
                        <DialogTitle className="text-right text-xl">إدارة صور المدير</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Current images grid */}
                        {adminProfilePics.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-right font-semibold text-lg">الصور الحالية ({adminProfilePics.length})</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                              {adminProfilePics.map((pic, index) => (
                                <div key={index} className="relative group">
                                  <img 
                                    src={pic} 
                                    alt={`صورة ${index + 1}`} 
                                    className="w-full aspect-square object-cover rounded-lg shadow-md"
                                    data-testid={`img-profile-${index}`}
                                  />
                                  <div className={`absolute inset-0 border-2 rounded-lg transition-colors ${
                                    index === currentImageIndex 
                                      ? 'border-blue-400 shadow-blue-400/50 shadow-lg' 
                                      : 'border-transparent'
                                  }`} />
                                  <button 
                                    onClick={() => {
                                      const newPics = adminProfilePics.filter((_, i) => i !== index);
                                      setAdminProfilePics(newPics);
                                      if (currentImageIndex >= newPics.length && newPics.length > 0) {
                                        setCurrentImageIndex(0);
                                      }
                                      if (newPics.length > 0) {
                                        localStorage.setItem('adminProfilePics', JSON.stringify(newPics));
                                      } else {
                                        localStorage.removeItem('adminProfilePics');
                                      }
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                                    data-testid={`button-remove-${index}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  {index === currentImageIndex && (
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                      نشط
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Upload new images */}
                        <div className="space-y-3">
                          <Label htmlFor="profile-pic-upload" className="text-right text-lg font-semibold">إضافة صور جديدة</Label>
                          <Input 
                            id="profile-pic-upload"
                            type="file" 
                            accept="image/*"
                            multiple
                            onChange={handleProfilePicUpload}
                            className="text-right border-2 border-dashed hover:border-solid transition-all duration-200"
                            data-testid="input-profile-pic-upload"
                          />
                          <p className="text-sm text-muted-foreground text-right bg-muted/50 p-3 rounded-lg">
                            💡 يمكنك اختيار عدة صور في نفس الوقت. ستتغير الصور تلقائياً كل 3 ثوانِ.
                          </p>
                        </div>
                        
                        <div className="flex justify-end space-x-reverse space-x-3 pt-4 border-t">
                          <Button onClick={removeAllProfilePics} variant="destructive" className="hover:scale-105 transition-transform" data-testid="button-remove-all-profile">
                            <X className="w-4 h-4 ml-2" />
                            حذف جميع الصور
                          </Button>
                          <Button onClick={() => setProfilePicDialogOpen(false)} variant="outline" className="hover:scale-105 transition-transform" data-testid="button-close-profile-dialog">
                            إغلاق
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center p-6" data-testid="placeholder-no-profile">
                {userRole === 'admin' ? (
                  <Dialog open={profilePicDialogOpen} onOpenChange={setProfilePicDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="w-full h-full flex flex-col items-center justify-center hover:bg-white/10 rounded-xl transition-all duration-300 group" data-testid="button-add-profile">
                        <div className="bg-gradient-to-br from-white/20 to-white/10 rounded-full p-4 mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Camera className="w-8 h-8 text-blue-300 drop-shadow-lg" />
                        </div>
                        <span className="text-sm text-blue-200 font-semibold group-hover:text-white transition-colors duration-300">إضافة صور</span>
                        <span className="text-xs text-blue-300/70 mt-1">اضغط لرفع الصور</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" data-testid="dialog-add-admin-profile">
                      <DialogHeader>
                        <DialogTitle className="text-right text-xl">إضافة صور المدير</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label htmlFor="new-profile-pic-upload" className="text-right text-lg">اختيار الصور</Label>
                          <Input 
                            id="new-profile-pic-upload"
                            type="file" 
                            accept="image/*"
                            multiple
                            onChange={handleProfilePicUpload}
                            className="text-right border-2 border-dashed hover:border-solid transition-all duration-200"
                            data-testid="input-new-profile-pic-upload"
                          />
                          <p className="text-sm text-muted-foreground text-right bg-muted/50 p-3 rounded-lg">
                            💡 يمكنك اختيار عدة صور معاً. ستتناوب الصور تلقائياً كل 3 ثوانِ.
                          </p>
                        </div>
                        <div className="flex justify-end pt-4 border-t">
                          <Button onClick={() => setProfilePicDialogOpen(false)} variant="outline" data-testid="button-close-add-profile-dialog">
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-gradient-to-br from-white/20 to-white/10 rounded-full p-4 mb-3">
                      <User className="w-8 h-8 text-blue-300 drop-shadow-lg" />
                    </div>
                    <span className="text-sm text-blue-200">لا توجد صور</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}