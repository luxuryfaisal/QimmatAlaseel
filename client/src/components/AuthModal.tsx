import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, User, Loader2 } from "lucide-react";

interface AuthModalProps {
  onLogin: (username: string) => void;
}

export default function AuthModal({ onLogin }: AuthModalProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onLogin(data.user.username);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="auth-gradient w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">دخول النظام</h2>
            <p className="text-muted-foreground">الرجاء إدخال بيانات الدخول للوصول إلى نظام تتبع الطلبات</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <User className="w-4 h-4 inline ml-1" />
                اسم المستخدم
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="rtl-input"
                required
                data-testid="input-username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <Lock className="w-4 h-4 inline ml-1" />
                كلمة المرور
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="rtl-input"
                required
                data-testid="input-password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-1" />
              ) : (
                <User className="w-4 h-4 ml-1" />
              )}
              دخول
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            للوصول التجريبي: admin / admin123
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
