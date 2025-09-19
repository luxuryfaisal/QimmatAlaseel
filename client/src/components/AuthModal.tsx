import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, User, Loader2 } from "lucide-react";
import type { User as UserType } from "@shared/schema";


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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-blue-800/90 backdrop-blur-sm flex items-center justify-center z-50" dir="rtl">
      <div className="login-container w-full max-w-md mx-4">
        {/* Company Name Header */}
        <div className="text-center mb-8">
          <div className="company-logo-container mb-4">
            <div className="company-gradient w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="company-name text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">
            شركة قمة الأصيل
          </h1>
          <p className="company-subtitle text-white/80 text-lg font-medium mb-2">
            للعقارات
          </p>
        </div>
        
        <Card className="login-card shadow-2xl border-0 bg-white/10 backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">دخول النظام</h2>
              <p className="text-white/70">الرجاء اختيار طريقة الدخول للوصول إلى نظام تتبع الطلبات</p>
            </div>
            
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={authMode === 'login' ? 'default' : 'outline'}
                onClick={() => setAuthMode('login')}
                className={`flex-1 transition-all duration-300 transform hover:scale-105 ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-lg text-white'
                    : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                }`}
                data-testid="button-login-mode"
              >
                دخول مدير
              </Button>
              <Button
                type="button"
                variant={authMode === 'guest' ? 'default' : 'outline'}
                onClick={() => setAuthMode('guest')}
                className={`flex-1 transition-all duration-300 transform hover:scale-105 ${
                  authMode === 'guest'
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 border-0 shadow-lg text-white'
                    : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                }`}
                data-testid="button-guest-mode"
              >
                دخول زائر
              </Button>
            </div>
            
            {authMode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="input-group">
                <label className="block text-sm font-medium text-white mb-2">
                  <User className="w-4 h-4 inline ml-1" />
                  اسم المستخدم
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="login-input bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50 transition-all duration-300"
                  required
                  data-testid="input-username"
                />
              </div>
              
              <div className="input-group">
                <label className="block text-sm font-medium text-white mb-2">
                  <Lock className="w-4 h-4 inline ml-1" />
                  كلمة المرور
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="login-input bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50 transition-all duration-300"
                  required
                  data-testid="input-password"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin ml-1" />
                ) : (
                  <User className="w-5 h-5 ml-1" />
                )}
                دخول
              </Button>
            </form>
            ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                <User className="w-16 h-16 text-white mx-auto mb-4" />
                <h3 className="font-medium mb-3 text-white text-lg">دخول كزائر</h3>
                <p className="text-sm text-white/70 mb-6 leading-relaxed">
                  سيمكنك الدخول كزائر من مشاهدة البيانات فقط بدون إمكانية التعديل
                </p>
                <Button 
                  onClick={handleGuestLogin}
                  disabled={guestMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  data-testid="button-guest-login"
                >
                  {guestMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin ml-1" />
                  ) : (
                    <User className="w-5 h-5 ml-1" />
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