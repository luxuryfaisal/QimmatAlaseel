import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, CheckCircle, Sparkles, User } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface WelcomeModalProps {
  user: UserType;
  onClose: () => void;
}

export default function WelcomeModal({ user, onClose }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Allow exit animation to complete
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* Welcome Modal */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 50 }}
            transition={{ 
              type: "spring", 
              duration: 0.6, 
              bounce: 0.3 
            }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            dir="rtl"
          >
            <div 
              className="welcome-card bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md mx-4 pointer-events-auto overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
              }}
            >
              {/* Animated background elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-amber-400/20"
                    style={{
                      width: Math.random() * 100 + 50,
                      height: Math.random() * 100 + 50,
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                    }}
                    animate={{
                      x: [0, Math.random() * 100 - 50],
                      y: [0, Math.random() * 100 - 50],
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", duration: 0.6 }}
                  className="mb-6 relative"
                >
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-400/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-green-600/90 to-emerald-500/90 shadow-2xl border border-white/30">
                      <CheckCircle className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  
                  {/* Sparkles animation */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: 50 + Math.cos((i * 45 * Math.PI) / 180) * 60,
                        top: 50 + Math.sin((i * 45 * Math.PI) / 180) * 60,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Welcome Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mb-6"
                >
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    مرحباً بك! 
                  </h2>
                  <motion.h3 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent mb-4"
                    data-testid="welcome-username"
                  >
                    {user.username}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="text-slate-600 text-lg leading-relaxed"
                  >
                    تم تسجيل دخولك بنجاح إلى نظام شركة قمة الأصيل للعقارات
                  </motion.p>
                </motion.div>

                {/* Company branding */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="flex items-center justify-center gap-3 text-slate-500"
                >
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-medium">شركة قمة الأصيل للعقارات</span>
                </motion.div>

                {/* Progress bar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.3 }}
                  className="mt-6 relative"
                >
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-amber-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1.5, duration: 2.5, ease: "linear" }}
                    />
                  </div>
                  <p className="text-sm text-slate-400 mt-2">سيتم إعادة توجيهك إلى النظام...</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}