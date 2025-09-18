import { type User, type InsertUser, type Order, type InsertOrder, type Note, type InsertNote, type Task, type InsertTask, type TaskNote, type InsertTaskNote, type Attachment, type InsertAttachment, type Settings, type InsertSettings, type Section, type InsertSection } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Order methods
  getAllOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  // Note methods
  getNotesByOrderId(orderId: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Task methods
  getAllTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Task Note methods
  getTaskNotesByTaskId(taskId: string): Promise<TaskNote[]>;
  getTaskNote(id: string): Promise<TaskNote | undefined>;
  createTaskNote(note: InsertTaskNote): Promise<TaskNote>;
  updateTaskNote(id: string, note: Partial<InsertTaskNote>): Promise<TaskNote | undefined>;
  deleteTaskNote(id: string): Promise<boolean>;

  // Attachment methods
  getAttachmentsByTaskId(taskId: string): Promise<Attachment[]>;
  getAttachment(id: string): Promise<Attachment | undefined>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string): Promise<boolean>;

  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  // Section methods
  getAllSections(): Promise<Section[]>;
  getSection(id: string): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: string, section: Partial<InsertSection>): Promise<Section | undefined>;
  deleteSection(id: string): Promise<boolean>;

  // PIN verification
  verifyPin(pin: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private notes: Map<string, Note>;
  private tasks: Map<string, Task>;
  private taskNotes: Map<string, TaskNote>;
  private attachments: Map<string, Attachment>;
  private settings: Settings | undefined;
  private sections: Map<string, Section>;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.notes = new Map();
    this.tasks = new Map();
    this.taskNotes = new Map();
    this.attachments = new Map();
    this.sections = new Map();
    
    // Initialize with default admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "admin123",
      role: "admin",
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    // Initialize default settings
    this.settings = {
      id: randomUUID(),
      ordersSectionName: "طلبات الكهرباء",
      tasksSectionName: "قسم إدارة المهام",
      backgroundColor: "#ffffff",
      pinHash: null,
      allowGuest: "true",
      companyLogo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initialize default sections
    const defaultSections = [
      {
        name: "طلبات الكهرباء",
        baseType: "orders",
        color: "#3b82f6",
        orderIndex: "0",
        columnLabels: JSON.stringify({
          orderNumber: "رقم الطلب",
          partNumber: "رقم القطعة", 
          status: "حالة الطلب",
          lastInquiry: "تاريخ آخر استفسار"
        }),
        isActive: "true"
      },
      {
        name: "قسم إدارة المهام",
        baseType: "tasks",
        color: "#10b981",
        orderIndex: "1",
        columnLabels: JSON.stringify({
          taskName: "اسم المهمة",
          taskType: "نوع المهمة",
          taskStatus: "حالة المهمة",
          dueDate: "تاريخ الاستحقاق",
          lastInquiry: "تاريخ آخر استفسار"
        }),
        isActive: "true"
      }
    ];

    defaultSections.forEach(sectionData => {
      const section: Section = {
        id: randomUUID(),
        ...sectionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.sections.set(section.id, section);
    });

    // Initialize with sample orders from the original HTML
    const sampleOrders = [
      { orderNumber: "251024435", partNumber: "87-2" },
      { orderNumber: "25100006", partNumber: "87-1" },
      { orderNumber: "241167299", partNumber: "1322" },
      { orderNumber: "251016443", partNumber: "152" },
      { orderNumber: "251016435", partNumber: "1541-2" },
      { orderNumber: "251016376", partNumber: "1441" },
      { orderNumber: "251016362", partNumber: "59" },
      { orderNumber: "251016352", partNumber: "1439" },
      { orderNumber: "251016312", partNumber: "154" },
      { orderNumber: "251047395", partNumber: "151" },
      { orderNumber: "251047386", partNumber: "153" },
    ];

    sampleOrders.forEach(orderData => {
      const order: Order = {
        id: randomUUID(),
        orderNumber: orderData.orderNumber,
        partNumber: orderData.partNumber,
        lastInquiry: "",
        status: "قيد المراجعة",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.orders.set(order.id, order);
    });

    // Initialize with sample tasks
    const sampleTasks = [
      { taskName: "مراجعة التقارير الشهرية", taskType: "إدارية", dueDate: "2025-09-25" },
      { taskName: "صيانة الأجهزة الكهربائية", taskType: "صيانة", dueDate: "2025-09-30" },
      { taskName: "تحديث قاعدة البيانات", taskType: "تقنية", dueDate: "2025-10-01" },
      { taskName: "اجتماع الفريق الأسبوعي", taskType: "اجتماع", dueDate: "2025-09-20" },
    ];

    sampleTasks.forEach(taskData => {
      const task: Task = {
        id: randomUUID(),
        taskName: taskData.taskName,
        taskType: taskData.taskType,
        lastInquiry: "",
        taskStatus: "جاري العمل",
        dueDate: taskData.dueDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.tasks.set(task.id, task);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "viewer",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      ...updateData
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Order methods
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => {
      const dateB = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateA = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateA - dateB;
    });
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const now = new Date();
    const order: Order = { 
      id,
      orderNumber: insertOrder.orderNumber,
      partNumber: insertOrder.partNumber || null,
      lastInquiry: insertOrder.lastInquiry || null,
      status: insertOrder.status || "قيد المراجعة",
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;

    const updatedOrder: Order = {
      ...existingOrder,
      ...updateData,
      updatedAt: new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const deleted = this.orders.delete(id);
    // Also delete associated notes
    const orderNotes = Array.from(this.notes.values()).filter(note => note.orderId === id);
    orderNotes.forEach(note => this.notes.delete(note.id));
    return deleted;
  }

  // Note methods
  async getNotesByOrderId(orderId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.orderId === orderId);
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const now = new Date();
    const note: Note = { 
      ...insertNote, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updateData: Partial<InsertNote>): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote) return undefined;

    const updatedNote: Note = {
      ...existingNote,
      ...updateData,
      updatedAt: new Date()
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Task methods
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => {
      const dateB = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateA = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateA - dateB;
    });
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = { 
      id,
      taskName: insertTask.taskName,
      taskType: insertTask.taskType || null,
      lastInquiry: insertTask.lastInquiry || null,
      taskStatus: insertTask.taskStatus || "جاري العمل",
      dueDate: insertTask.dueDate || null,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    const updatedTask: Task = {
      ...existingTask,
      ...updateData,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const deleted = this.tasks.delete(id);
    // Also delete associated task notes and attachments
    const relatedTaskNotes = Array.from(this.taskNotes.values()).filter(note => note.taskId === id);
    relatedTaskNotes.forEach(note => this.taskNotes.delete(note.id));
    
    const relatedAttachments = Array.from(this.attachments.values()).filter(attachment => attachment.taskId === id);
    relatedAttachments.forEach(attachment => this.attachments.delete(attachment.id));
    
    return deleted;
  }

  // Task Note methods
  async getTaskNotesByTaskId(taskId: string): Promise<TaskNote[]> {
    return Array.from(this.taskNotes.values()).filter(note => note.taskId === taskId);
  }

  async getTaskNote(id: string): Promise<TaskNote | undefined> {
    return this.taskNotes.get(id);
  }

  async createTaskNote(insertTaskNote: InsertTaskNote): Promise<TaskNote> {
    const id = randomUUID();
    const now = new Date();
    const taskNote: TaskNote = { 
      ...insertTaskNote, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.taskNotes.set(id, taskNote);
    return taskNote;
  }

  async updateTaskNote(id: string, updateData: Partial<InsertTaskNote>): Promise<TaskNote | undefined> {
    const existingNote = this.taskNotes.get(id);
    if (!existingNote) return undefined;

    const updatedNote: TaskNote = {
      ...existingNote,
      ...updateData,
      updatedAt: new Date()
    };
    this.taskNotes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteTaskNote(id: string): Promise<boolean> {
    return this.taskNotes.delete(id);
  }

  // Attachment methods
  async getAttachmentsByTaskId(taskId: string): Promise<Attachment[]> {
    return Array.from(this.attachments.values()).filter(attachment => attachment.taskId === taskId);
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    return this.attachments.get(id);
  }

  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const id = randomUUID();
    const attachment: Attachment = { 
      ...insertAttachment, 
      id,
      createdAt: new Date()
    };
    this.attachments.set(id, attachment);
    return attachment;
  }

  async deleteAttachment(id: string): Promise<boolean> {
    return this.attachments.delete(id);
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(updateData: Partial<InsertSettings>): Promise<Settings> {
    if (!this.settings) {
      // Create new settings if none exist
      this.settings = {
        id: randomUUID(),
        ordersSectionName: "طلبات الكهرباء",
        tasksSectionName: "قسم إدارة المهام",
        backgroundColor: "#ffffff",
        pinHash: null,
        allowGuest: "true",
        companyLogo: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    this.settings = {
      ...this.settings,
      ...updateData,
      updatedAt: new Date()
    };
    return this.settings;
  }

  // Section methods
  async getAllSections(): Promise<Section[]> {
    return Array.from(this.sections.values()).sort((a, b) => {
      return parseInt(a.orderIndex || "0") - parseInt(b.orderIndex || "0");
    });
  }

  async getSection(id: string): Promise<Section | undefined> {
    return this.sections.get(id);
  }

  async createSection(insertSection: InsertSection): Promise<Section> {
    const id = randomUUID();
    const now = new Date();
    const section: Section = { 
      id,
      name: insertSection.name,
      baseType: insertSection.baseType,
      orderIndex: insertSection.orderIndex || "0",
      color: insertSection.color || "#3b82f6",
      columnLabels: insertSection.columnLabels || null,
      isActive: insertSection.isActive || "true",
      createdAt: now,
      updatedAt: now
    };
    this.sections.set(id, section);
    return section;
  }

  async updateSection(id: string, updateData: Partial<InsertSection>): Promise<Section | undefined> {
    const existingSection = this.sections.get(id);
    if (!existingSection) return undefined;

    const updatedSection: Section = {
      ...existingSection,
      ...updateData,
      updatedAt: new Date()
    };
    this.sections.set(id, updatedSection);
    return updatedSection;
  }

  async deleteSection(id: string): Promise<boolean> {
    return this.sections.delete(id);
  }

  // PIN verification
  async verifyPin(pin: string): Promise<boolean> {
    if (!this.settings || !this.settings.pinHash) {
      return false; // No PIN set
    }
    
    // Simple hash comparison (in production, use proper crypto)
    const crypto = require('crypto');
    const inputHash = crypto.createHash('sha256').update(pin).digest('hex');
    return inputHash === this.settings.pinHash;
  }
}

export const storage = new MemStorage();
