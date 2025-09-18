import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertNoteSchema, insertTaskSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
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
        user: { id: user.id, username: user.username } 
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

  const httpServer = createServer(app);
  return httpServer;
}
