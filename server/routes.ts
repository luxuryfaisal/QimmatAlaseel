import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertNoteSchema, insertTaskSchema, insertTaskNoteSchema, insertAttachmentSchema, insertSettingsSchema, insertSectionSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role } 
      });
    } catch (error) {
      res.status(400).json({ message: "خطأ في البيانات المرسلة" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الطلبات" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const newOrder = await storage.createOrder(orderData);
      res.status(201).json(newOrder);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء الطلب" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(id, updateData);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث الطلب" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteOrder(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الطلب" });
    }
  });

  // Note routes
  app.get("/api/orders/:orderId/notes", async (req, res) => {
    try {
      const { orderId } = req.params;
      const notes = await storage.getNotesByOrderId(orderId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الملاحظات" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const newNote = await storage.createNote(noteData);
      res.status(201).json(newNote);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء الملاحظة" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertNoteSchema.partial().parse(req.body);
      const updatedNote = await storage.updateNote(id, updateData);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "الملاحظة غير موجودة" });
      }

      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث الملاحظة" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteNote(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "الملاحظة غير موجودة" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الملاحظة" });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع المهام" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء المهمة" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(id, updateData);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }

      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث المهمة" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف المهمة" });
    }
  });

  // Guest authentication route
  app.post("/api/auth/guest", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings || settings.allowGuest !== "true") {
        return res.status(403).json({ message: "دخول الزائر غير متاح" });
      }

      res.json({ 
        success: true, 
        user: { id: "guest", username: "زائر", role: "guest" } 
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في دخول الزائر" });
    }
  });

  // Task Notes routes
  app.get("/api/tasks/:taskId/notes", async (req, res) => {
    try {
      const { taskId } = req.params;
      const notes = await storage.getTaskNotesByTaskId(taskId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع ملاحظات المهمة" });
    }
  });

  app.post("/api/task-notes", async (req, res) => {
    try {
      const noteData = insertTaskNoteSchema.parse(req.body);
      const newNote = await storage.createTaskNote(noteData);
      res.status(201).json(newNote);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء ملاحظة المهمة" });
    }
  });

  app.put("/api/task-notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertTaskNoteSchema.partial().parse(req.body);
      const updatedNote = await storage.updateTaskNote(id, updateData);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "ملاحظة المهمة غير موجودة" });
      }

      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث ملاحظة المهمة" });
    }
  });

  app.delete("/api/task-notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTaskNote(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "ملاحظة المهمة غير موجودة" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف ملاحظة المهمة" });
    }
  });

  // Attachments routes
  app.get("/api/tasks/:taskId/attachments", async (req, res) => {
    try {
      const { taskId } = req.params;
      const attachments = await storage.getAttachmentsByTaskId(taskId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع المرفقات" });
    }
  });

  app.post("/api/attachments", async (req, res) => {
    try {
      const attachmentData = insertAttachmentSchema.parse(req.body);
      
      // Validate file type (must be image)
      if (!attachmentData.fileData.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/)) {
        return res.status(400).json({ message: "نوع الملف غير مدعوم - الصور فقط" });
      }
      
      // Calculate actual file size from base64 data
      const base64Data = attachmentData.fileData.split(',')[1];
      const actualSizeInBytes = Math.floor((base64Data.length * 3) / 4);
      
      // Validate file size (2MB limit based on actual data)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (actualSizeInBytes > maxSize) {
        return res.status(400).json({ message: "حجم الملف يتجاوز الحد المسموح (2MB)" });
      }
      
      // Check number of existing attachments for this task (max 10)
      const existingAttachments = await storage.getAttachmentsByTaskId(attachmentData.taskId);
      if (existingAttachments.length >= 10) {
        return res.status(400).json({ message: "تم الوصول للحد الأقصى من المرفقات (10)" });
      }
      
      // Update size with actual calculated size
      attachmentData.size = actualSizeInBytes.toString();
      
      const newAttachment = await storage.createAttachment(attachmentData);
      res.status(201).json(newAttachment);
    } catch (error) {
      res.status(400).json({ message: "خطأ في رفع المرفق" });
    }
  });

  app.delete("/api/attachments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAttachment(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "المرفق غير موجود" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف المرفق" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الإعدادات" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const updateData = insertSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateSettings(updateData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث الإعدادات" });
    }
  });

  // PIN routes
  app.post("/api/pin/verify", async (req, res) => {
    try {
      const { pin } = pinSchema.parse(req.body);
      const isValid = await storage.verifyPin(pin);
      
      if (!isValid) {
        return res.status(401).json({ message: "رقم الحماية غير صحيح" });
      }

      res.json({ success: true, timestamp: Date.now() });
    } catch (error) {
      res.status(400).json({ message: "خطأ في التحقق من رقم الحماية" });
    }
  });

  app.post("/api/pin/set", async (req, res) => {
    try {
      const { pin } = setPinSchema.parse(req.body);
      const crypto = require('crypto');
      const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
      
      await storage.updateSettings({ pinHash });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "خطأ في تعيين رقم الحماية" });
    }
  });

  // Sections routes
  app.get("/api/sections", async (req, res) => {
    try {
      const sections = await storage.getAllSections();
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الأقسام" });
    }
  });

  app.post("/api/sections", async (req, res) => {
    try {
      const sectionData = insertSectionSchema.parse(req.body);
      const newSection = await storage.createSection(sectionData);
      res.status(201).json(newSection);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء القسم" });
    }
  });

  app.put("/api/sections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertSectionSchema.partial().parse(req.body);
      const updatedSection = await storage.updateSection(id, updateData);
      
      if (!updatedSection) {
        return res.status(404).json({ message: "القسم غير موجود" });
      }

      res.json(updatedSection);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث القسم" });
    }
  });

  app.delete("/api/sections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSection(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "القسم غير موجود" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف القسم" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't return passwords
      const safeUsers = users.map(user => ({ ...user, password: undefined }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع المستخدمين" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      // Don't return password
      const safeUser = { ...newUser, password: undefined };
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(400).json({ message: "خطأ في إنشاء المستخدم" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertUserSchema.partial().parse(req.body);
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

  const httpServer = createServer(app);
  return httpServer;
}
