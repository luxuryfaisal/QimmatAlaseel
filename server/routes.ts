import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertOrderSchema, insertNoteSchema, insertTaskSchema, insertTaskNoteSchema, insertAttachmentSchema, insertSettingsSchema, insertSectionSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Extend session data types
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    role?: string;
  }
}

// Extend Express Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user: {
      id: string;
      username: string;
      role: string;
    };
  }
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const pinSchema = z.object({
  pin: z.string().length(4)
});

const setPinSchema = z.object({
  pin: z.string().length(4)
});

// Authorization middleware for any authenticated user (including guests)
const requireAuth = async (req: any, res: any, next: any) => {
  // Check session for authenticated user
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "غير مخول للوصول" });
  }
  
  try {
    // For guest users, session contains the info
    if (req.session.userId.startsWith('guest_')) {
      req.user = { 
        id: req.session.userId, 
        username: req.session.username || 'زائر', 
        role: 'guest' 
      };
      next();
    } else {
      // For regular users, get from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "غير مخول للوصول" });
      }
      
      req.user = { id: user.id, username: user.username, role: user.role || 'viewer' };
      next();
    }
  } catch (error) {
    return res.status(401).json({ message: "غير مخول للوصول" });
  }
};

// Middleware to check if user can perform write operations (admin, employee, and editor)
const requireWrite = async (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "غير مخول للوصول" });
  }
  
  // Admin, employee, and editor roles can perform write operations
  if (req.user.role !== 'admin' && req.user.role !== 'employee' && req.user.role !== 'editor') {
    return res.status(403).json({ message: "ليس لديك صلاحية للتعديل - للمشاهدة فقط" });
  }
  
  next();
};

// Authorization middleware for admin-only routes using session
const requireAdmin = async (req: any, res: any, next: any) => {
  // Check session for authenticated user
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "غير مخول للوصول" });
  }
  
  try {
    // Get user from storage to verify current role
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "يجب أن تكون مديراً للوصول لهذه الميزة" });
    }
    
    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "غير مخول للوصول" });
  }
};

// Authorization middleware for admin and employee routes using session
const requireAdminOrEmployee = async (req: any, res: any, next: any) => {
  // Check session for authenticated user
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "غير مخول للوصول" });
  }
  
  try {
    // Get user from storage to verify current role
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
      return res.status(403).json({ message: "يجب أن تكون مديراً أو موظفاً للوصول لهذه الميزة" });
    }
    
    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "غير مخول للوصول" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict' // CSRF protection
    }
  }));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }
      
      // Store user session for secure authentication  
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role || undefined;

      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      res.status(400).json({ message: "خطأ في البيانات المرسلة" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
          }
          res.clearCookie('connect.sid'); // Clear session cookie
          res.json({ success: true });
        });
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ message: "خطأ في تسجيل الخروج" });
    }
  });

  app.post("/api/auth/guest", async (req, res) => {
    try {
      // Check if guest access is allowed from admin settings
      // Use admin user ID to check global settings
      const adminUser = await storage.getUserByUsername('admin');
      if (!adminUser) {
        return res.status(500).json({ message: "خطأ في النظام" });
      }
      
      const settings = await storage.getSettings(adminUser.id);
      if (!settings || settings.allowGuest !== 'true') {
        return res.status(403).json({ message: "دخول الزائر غير مسموح حالياً" });
      }

      // Create guest session
      const guestId = `guest_${Date.now()}`;
      req.session.userId = guestId;
      req.session.username = "زائر";
      req.session.role = "guest";

      res.json({
        success: true,
        user: {
          id: guestId,
          username: "زائر",
          role: "guest"
        }
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في دخول الزائر" });
    }
  });

  // Order routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الطلبات" });
    }
  });

  app.post("/api/orders", requireAuth, requireWrite, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const newOrder = await storage.createOrder(orderData, req.user.id);
      res.status(201).json(newOrder);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء الطلب" });
    }
  });

  app.put("/api/orders/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(id, updateData, req.user.id);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث الطلب" });
    }
  });

  app.delete("/api/orders/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteOrder(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الطلب" });
    }
  });

  // Note routes
  app.get("/api/orders/:orderId/notes", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const notes = await storage.getNotesByOrderId(orderId, req.user.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الملاحظات" });
    }
  });

  app.post("/api/notes", requireAuth, requireWrite, async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const newNote = await storage.createNote(noteData, req.user.id);
      res.status(201).json(newNote);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء الملاحظة" });
    }
  });

  app.put("/api/notes/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertNoteSchema.partial().parse(req.body);
      const updatedNote = await storage.updateNote(id, updateData, req.user.id);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "الملاحظة غير موجودة" });
      }

      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث الملاحظة" });
    }
  });

  app.delete("/api/notes/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteNote(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "الملاحظة غير موجودة" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الملاحظة" });
    }
  });

  // Task routes
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getAllTasks(req.user.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع المهام" });
    }
  });

  app.post("/api/tasks", requireAuth, requireWrite, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const newTask = await storage.createTask(taskData, req.user.id);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء المهمة" });
    }
  });

  app.put("/api/tasks/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(id, updateData, req.user.id);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }

      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث المهمة" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTask(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف المهمة" });
    }
  });


  // Task Notes routes
  app.get("/api/tasks/:taskId/notes", requireAuth, async (req, res) => {
    try {
      const { taskId } = req.params;
      const notes = await storage.getTaskNotesByTaskId(taskId, req.user.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع ملاحظات المهمة" });
    }
  });

  app.post("/api/task-notes", requireAuth, requireWrite, async (req, res) => {
    try {
      const noteData = insertTaskNoteSchema.parse(req.body);
      const newNote = await storage.createTaskNote(noteData, req.user.id);
      res.status(201).json(newNote);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء ملاحظة المهمة" });
    }
  });

  app.put("/api/task-notes/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertTaskNoteSchema.partial().parse(req.body);
      const updatedNote = await storage.updateTaskNote(id, updateData, req.user.id);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "ملاحظة المهمة غير موجودة" });
      }

      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث ملاحظة المهمة" });
    }
  });

  app.delete("/api/task-notes/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTaskNote(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "ملاحظة المهمة غير موجودة" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف ملاحظة المهمة" });
    }
  });

  // Attachments routes
  app.get("/api/tasks/:taskId/attachments", requireAuth, async (req, res) => {
    try {
      const { taskId } = req.params;
      const attachments = await storage.getAttachmentsByTaskId(taskId, req.user.id);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع المرفقات" });
    }
  });

  app.post("/api/attachments", requireAuth, requireWrite, async (req, res) => {
    try {
      const attachmentData = insertAttachmentSchema.parse(req.body);
      
      // Validate file type (must be image)
      if (!attachmentData.dataBase64.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/)) {
        return res.status(400).json({ message: "نوع الملف غير مدعوم - الصور فقط" });
      }
      
      // Calculate actual file size from base64 data
      const base64Data = attachmentData.dataBase64.split(',')[1];
      const actualSizeInBytes = Math.floor((base64Data.length * 3) / 4);
      
      // Validate file size (2MB limit based on actual data)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (actualSizeInBytes > maxSize) {
        return res.status(400).json({ message: "حجم الملف يتجاوز الحد المسموح (2MB)" });
      }
      
      // Check number of existing attachments for this task (max 10)
      const existingAttachments = await storage.getAttachmentsByTaskId(attachmentData.taskId, req.user.id);
      if (existingAttachments.length >= 10) {
        return res.status(400).json({ message: "تم الوصول للحد الأقصى من المرفقات (10)" });
      }
      
      // Update size with actual calculated size
      attachmentData.size = actualSizeInBytes.toString();
      
      const newAttachment = await storage.createAttachment(attachmentData, req.user.id);
      res.status(201).json(newAttachment);
    } catch (error) {
      res.status(400).json({ message: "خطأ في رفع المرفق" });
    }
  });

  app.delete("/api/attachments/:id", requireAuth, requireWrite, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAttachment(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "المرفق غير موجود" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف المرفق" });
    }
  });

  // Settings routes
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings(req.user.id);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الإعدادات" });
    }
  });

  app.put("/api/settings", requireAuth, async (req, res) => {
    try {
      const updateData = insertSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateSettings(updateData, req.user.id);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث الإعدادات" });
    }
  });

  // PIN routes
  app.post("/api/pin/verify", requireAuth, async (req, res) => {
    try {
      const { pin } = pinSchema.parse(req.body);
      const isValid = await storage.verifyPin(pin, req.user.id);
      
      if (!isValid) {
        return res.status(401).json({ message: "رقم الحماية غير صحيح" });
      }

      res.json({ success: true, timestamp: Date.now() });
    } catch (error) {
      res.status(400).json({ message: "خطأ في التحقق من رقم الحماية" });
    }
  });

  app.post("/api/pin/set", requireAuth, async (req, res) => {
    try {
      const { pin } = setPinSchema.parse(req.body);
      const crypto = require('crypto');
      const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
      
      await storage.updateSettings({ pinHash }, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "خطأ في تعيين رقم الحماية" });
    }
  });

  // Sections routes
  app.get("/api/sections", requireAuth, async (req, res) => {
    try {
      const sections = await storage.getAllSections(req.user.id);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الأقسام" });
    }
  });

  app.post("/api/sections", requireAdminOrEmployee, async (req, res) => {
    try {
      const sectionData = insertSectionSchema.parse(req.body);
      const newSection = await storage.createSection(sectionData, req.user.id);
      res.status(201).json(newSection);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء القسم" });
    }
  });

  app.put("/api/sections/:id", requireAdminOrEmployee, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertSectionSchema.partial().parse(req.body);
      const updatedSection = await storage.updateSection(id, updateData, req.user.id);
      
      if (!updatedSection) {
        return res.status(404).json({ message: "القسم غير موجود" });
      }

      res.json(updatedSection);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث القسم" });
    }
  });

  app.delete("/api/sections/:id", requireAdminOrEmployee, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSection(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "القسم غير موجود" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف القسم" });
    }
  });

  // User management routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Always hide password for security
      const safeUsers = users.map(user => ({ 
        ...user, 
        password: undefined // Always hide hashed password
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع المستخدمين" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      // storage.createUser will handle password hashing
      const newUser = await storage.createUser(userData);
      // Don't return password
      const safeUser = { ...newUser, password: undefined };
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء المستخدم" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertUserSchema.partial().parse(req.body);
      
      // storage.updateUser will handle password hashing if provided
      const updatedUser = await storage.updateUser(id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // Don't return password
      const safeUser = { ...updatedUser, password: undefined };
      res.json(safeUser);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث المستخدم" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف المستخدم" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
