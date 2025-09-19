import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Moon, Sun, Clock, Calendar, NotebookPen, Camera, Plus, X, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Safe ESM logo import with fallback
const logos = import.meta.glob('@assets/Picsart_25-09-19_00-28-14-307_1758237498784.png', { 
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
    قأ
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
  const [imageError, setImageError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [activeNoteTab, setActiveNoteTab] = useState("note1");
  const [notes, setNotes] = useState({
    note1: "",
    note2: "",
    note3: ""
  });
  const [adminProfilePic, setAdminProfilePic] = useState<string | null>(null);
  const [profilePicDialogOpen, setProfilePicDialogOpen] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved notes and profile pic from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('headerNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.warn('Failed to parse saved notes, using defaults', error);
        // Keep default empty notes if JSON is corrupted
      }
    }
    const savedProfilePic = localStorage.getItem('adminProfilePic');
    if (savedProfilePic) {
      setAdminProfilePic(savedProfilePic);
    }
  }, []);

  const saveNotes = () => {
    try {
      localStorage.setItem('headerNotes', JSON.stringify(notes));
      setNotesDialogOpen(false);
    } catch (error) {
      console.error('Failed to save notes', error);
      // Could add toast notification here for user feedback
    }
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
        setAdminProfilePic(result);
        try {
          localStorage.setItem('adminProfilePic', result);
          setProfilePicDialogOpen(false);
        } catch (error) {
          console.error('Failed to save profile picture', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePic = () => {
    setAdminProfilePic(null);
    localStorage.removeItem('adminProfilePic');
    setProfilePicDialogOpen(false);
  };

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
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
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
                alt="شعار شركة قمة الأصيل" 
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
          {/* Current Time Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center" data-testid="card-current-time">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-200 ml-2" />
              <span className="text-sm text-blue-200">الساعة الآن</span>
            </div>
            <div className="text-xl font-bold text-white" data-testid="text-current-time">
              {formatTimeArabic(currentTime)}
            </div>
          </div>

          {/* Date Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center" data-testid="card-dates">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-blue-200 ml-2" />
              <span className="text-sm text-blue-200">التاريخ</span>
            </div>
            {hijriFormatted && (
              <div className="text-xs text-white mb-1" data-testid="text-hijri-date">
                هـ: {hijriFormatted}
              </div>
            )}
            <div className="text-xs text-white" data-testid="text-gregorian-date">
              م: {gregorianDate}
            </div>
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
                    <TabsTrigger value="note1" data-testid="tab-note1">ملاحظة 1</TabsTrigger>
                    <TabsTrigger value="note2" data-testid="tab-note2">ملاحظة 2</TabsTrigger>
                    <TabsTrigger value="note3" data-testid="tab-note3">ملاحظة 3</TabsTrigger>
                  </TabsList>
                  <TabsContent value="note1" className="space-y-4">
                    <Textarea 
                      placeholder="اكتب ملاحظاتك هنا..."
                      className="min-h-[200px] text-right"
                      value={notes.note1}
                      onChange={(e) => setNotes(prev => ({ ...prev, note1: e.target.value }))}
                      data-testid="textarea-note1"
                    />
                  </TabsContent>
                  <TabsContent value="note2" className="space-y-4">
                    <Textarea 
                      placeholder="اكتب ملاحظاتك هنا..."
                      className="min-h-[200px] text-right"
                      value={notes.note2}
                      onChange={(e) => setNotes(prev => ({ ...prev, note2: e.target.value }))}
                      data-testid="textarea-note2"
                    />
                  </TabsContent>
                  <TabsContent value="note3" className="space-y-4">
                    <Textarea 
                      placeholder="اكتب ملاحظاتك هنا..."
                      className="min-h-[200px] text-right"
                      value={notes.note3}
                      onChange={(e) => setNotes(prev => ({ ...prev, note3: e.target.value }))}
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

          {/* Admin Profile Picture Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden" data-testid="card-admin-profile">
            {adminProfilePic ? (
              <div className="relative w-full h-full">
                <img 
                  src={adminProfilePic} 
                  alt="صورة المدير" 
                  className="w-full h-full object-cover"
                  data-testid="img-admin-profile"
                />
                {userRole === 'admin' && (
                  <Dialog open={profilePicDialogOpen} onOpenChange={setProfilePicDialogOpen}>
                    <DialogTrigger asChild>
                      <button 
                        className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100" 
                        data-testid="button-admin-profile"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" data-testid="dialog-admin-profile">
                      <DialogHeader>
                        <DialogTitle className="text-right">إدارة صورة المدير</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <img 
                            src={adminProfilePic} 
                            alt="صورة المدير الحالية" 
                            className="w-24 h-24 rounded-full object-cover"
                            data-testid="img-current-admin-profile"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-pic-upload" className="text-right">رفع صورة جديدة</Label>
                          <Input 
                            id="profile-pic-upload"
                            type="file" 
                            accept="image/*"
                            onChange={handleProfilePicUpload}
                            className="text-right"
                            data-testid="input-profile-pic-upload"
                          />
                        </div>
                        <div className="flex justify-end space-x-reverse space-x-2">
                          <Button onClick={removeProfilePic} variant="destructive" data-testid="button-remove-profile">
                            <X className="w-4 h-4 ml-2" />
                            حذف الصورة
                          </Button>
                          <Button onClick={() => setProfilePicDialogOpen(false)} variant="outline" data-testid="button-close-profile-dialog">
                            إغلاق
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4" data-testid="placeholder-no-profile">
                {userRole === 'admin' ? (
                  <Dialog open={profilePicDialogOpen} onOpenChange={setProfilePicDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="w-full h-full flex items-center justify-center hover:bg-white/5 rounded transition-colors" data-testid="button-add-profile">
                        <Camera className="w-8 h-8 text-blue-200" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" data-testid="dialog-admin-profile">
                      <DialogHeader>
                        <DialogTitle className="text-right">إضافة صورة المدير</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile-pic-upload" className="text-right">رفع صورة جديدة</Label>
                          <Input 
                            id="profile-pic-upload"
                            type="file" 
                            accept="image/*"
                            onChange={handleProfilePicUpload}
                            className="text-right"
                            data-testid="input-profile-pic-upload"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={() => setProfilePicDialogOpen(false)} variant="outline" data-testid="button-close-profile-dialog">
                            إغلاق
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <User className="w-8 h-8 text-blue-200/50" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}