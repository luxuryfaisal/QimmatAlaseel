import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, User, Loader2, Building2 } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import logoImage from "@assets/Picsart_25-09-19_00-28-14-307_1758250619138.png";


interface AuthModalProps {
  onLogin: (user: UserType) => void;
}

export default function AuthModal({ onLogin }: AuthModalProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<'login' | 'guest'>('login');

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Session-based authentication - no need to store tokens
        onLogin(data.user);
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${data.user.username}`
        });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: "بيانات الدخول غير صحيحة. الرجاء المحاولة مرة أخرى."
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال اسم المستخدم وكلمة المرور"
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const guestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/guest', {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onLogin(data.user);
        toast({
          title: "تم دخول الزائر بنجاح",
          description: "مرحباً بك كزائر"
        });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ في دخول الزائر",
        description: "دخول الزائر غير متاح حالياً"
      });
    }
  });

  const handleGuestLogin = () => {
    guestMutation.mutate();
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%),
          url(${logoImage})
        `,
        backgroundSize: '300px, 300px, 300px, cover, 80%',
        backgroundPosition: 'top left, bottom right, center, center, center',
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat, no-repeat'
      }}
      dir="rtl"
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/75 to-slate-800/90 backdrop-blur-[2px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      </div>
      
      <div className="login-container w-full max-w-md mx-4 relative z-10">
        {/* Company Name Header */}
        <div className="text-center mb-8">
          <div className="company-logo-container mb-6">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-amber-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600/80 to-amber-500/80 shadow-2xl border border-white/20 backdrop-blur-sm">
                <Building2 className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
          <h1 className="company-name text-5xl font-bold mb-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-2xl">
            شركة قمة الأصيل
          </h1>
          <p className="company-subtitle text-blue-200/90 text-xl font-medium mb-2 drop-shadow-lg">
            للعقارات
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-500 mx-auto rounded-full shadow-lg" />
        </div>
        
        <Card className="login-card shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">دخول النظام</h2>
              <p className="text-blue-200/80 text-lg leading-relaxed">الرجاء اختيار طريقة الدخول للوصول إلى نظام تتبع الطلبات</p>
            </div>
            
            <div className="flex gap-3 mb-8">
              <Button
                type="button"
                variant={authMode === 'login' ? 'default' : 'outline'}
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-4 text-lg font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-xl ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-0 shadow-lg text-white ring-2 ring-blue-400/30'
                    : 'bg-white/10 border-white/20 text-blue-200 hover:bg-white/20 backdrop-blur-sm'
                }`}
                data-testid="button-login-mode"
              >
                <Building2 className="w-5 h-5 ml-2" />
                دخول مدير
              </Button>
              <Button
                type="button"
                variant={authMode === 'guest' ? 'default' : 'outline'}
                onClick={() => setAuthMode('guest')}
                className={`flex-1 py-4 text-lg font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-xl ${
                  authMode === 'guest'
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 border-0 shadow-lg text-white ring-2 ring-emerald-400/30'
                    : 'bg-white/10 border-white/20 text-blue-200 hover:bg-white/20 backdrop-blur-sm'
                }`}
                data-testid="button-guest-mode"
              >
                <User className="w-5 h-5 ml-2" />
                دخول زائر
              </Button>
            </div>
            
            {authMode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="input-group">
                <label className="block text-lg font-medium text-blue-200 mb-3">
                  <User className="w-5 h-5 inline ml-2" />
                  اسم المستخدم
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="login-input bg-white/10 border-white/20 text-white placeholder:text-blue-200/60 focus:bg-white/20 focus:border-blue-400/50 h-14 text-lg backdrop-blur-sm transition-all duration-500 shadow-lg"
                    required
                    data-testid="input-username"
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
                </div>
              </div>
              
              <div className="input-group">
                <label className="block text-lg font-medium text-blue-200 mb-3">
                  <Lock className="w-5 h-5 inline ml-2" />
                  كلمة المرور
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="login-input bg-white/10 border-white/20 text-white placeholder:text-blue-200/60 focus:bg-white/20 focus:border-blue-400/50 h-14 text-lg backdrop-blur-sm transition-all duration-500 shadow-lg"
                    required
                    data-testid="input-password"
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-slate-900 font-bold py-4 text-xl rounded-xl transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-amber-500/25 ring-2 ring-amber-400/20" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin ml-2" />
                ) : (
                  <Building2 className="w-6 h-6 ml-2" />
                )}
                دخول النظام
              </Button>
            </form>
            ) : (
            <div className="space-y-6">
              <div className="text-center p-8 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-400/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-600/80 to-teal-500/80 shadow-2xl border border-white/20 backdrop-blur-sm">
                    <User className="w-10 h-10 text-white drop-shadow-lg" />
                  </div>
                </div>
                <h3 className="font-bold mb-4 text-white text-2xl drop-shadow-lg">دخول كزائر</h3>
                <p className="text-lg text-blue-200/80 mb-8 leading-relaxed">
                  سيمكنك الدخول كزائر من مشاهدة البيانات فقط بدون إمكانية التعديل
                </p>
                <Button 
                  onClick={handleGuestLogin}
                  disabled={guestMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-4 text-xl rounded-xl transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25 ring-2 ring-emerald-400/20"
                  data-testid="button-guest-login"
                >
                  {guestMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin ml-2" />
                  ) : (
                    <User className="w-6 h-6 ml-2" />
                  )}
                  دخول كزائر
                </Button>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}