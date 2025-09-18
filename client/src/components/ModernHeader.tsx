import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Moon, Sun } from "lucide-react";
import logoUrl from '@assets/generated_images/Qimmat_Al-Aseel_Company_Logo_f402e33f.png';

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
            <img 
              src={logoUrl} 
              alt="شعار شركة قمة الأصيل" 
              className="h-16 w-auto object-contain"
              data-testid="img-company-logo"
            />
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

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">24/7</div>
            <div className="text-xs text-blue-200">خدمة متواصلة</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">99%</div>
            <div className="text-xs text-blue-200">دقة في التنفيذ</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">500+</div>
            <div className="text-xs text-blue-200">مشروع مكتمل</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">15</div>
            <div className="text-xs text-blue-200">عام خبرة</div>
          </div>
        </div>
      </div>
    </div>
  );
}