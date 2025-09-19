import { type User, type InsertUser, type Order, type InsertOrder, type Note, type InsertNote, type Task, type InsertTask, type TaskNote, type InsertTaskNote, type Attachment, type InsertAttachment, type Settings, type InsertSettings, type Section, type InsertSection, type PersonalNotes, type InsertPersonalNotes } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Order methods
  getAllOrders(ownerId: string): Promise<Order[]>;
  getOrder(id: string, ownerId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder, ownerId: string): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>, ownerId: string): Promise<Order | undefined>;
  deleteOrder(id: string, ownerId: string): Promise<boolean>;

  // Note methods
  getNotesByOrderId(orderId: string, ownerId: string): Promise<Note[]>;
  getNote(id: string, ownerId: string): Promise<Note | undefined>;
  createNote(note: InsertNote, ownerId: string): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>, ownerId: string): Promise<Note | undefined>;
  deleteNote(id: string, ownerId: string): Promise<boolean>;

  // Task methods
  getAllTasks(ownerId: string): Promise<Task[]>;
  getTask(id: string, ownerId: string): Promise<Task | undefined>;
  createTask(task: InsertTask, ownerId: string): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>, ownerId: string): Promise<Task | undefined>;
  deleteTask(id: string, ownerId: string): Promise<boolean>;

  // Task Note methods
  getTaskNotesByTaskId(taskId: string, ownerId: string): Promise<TaskNote[]>;
  getTaskNote(id: string, ownerId: string): Promise<TaskNote | undefined>;
  createTaskNote(note: InsertTaskNote, ownerId: string): Promise<TaskNote>;
  updateTaskNote(id: string, note: Partial<InsertTaskNote>, ownerId: string): Promise<TaskNote | undefined>;
  deleteTaskNote(id: string, ownerId: string): Promise<boolean>;

  // Attachment methods
  getAttachmentsByTaskId(taskId: string, ownerId: string): Promise<Attachment[]>;
  getAttachment(id: string, ownerId: string): Promise<Attachment | undefined>;
  createAttachment(attachment: InsertAttachment, ownerId: string): Promise<Attachment>;
  deleteAttachment(id: string, ownerId: string): Promise<boolean>;

  // Settings methods
  getSettings(ownerId: string): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>, ownerId: string): Promise<Settings>;

  // Section methods
  getAllSections(ownerId: string): Promise<Section[]>;
  getSection(id: string, ownerId: string): Promise<Section | undefined>;
  createSection(section: InsertSection, ownerId: string): Promise<Section>;
  updateSection(id: string, section: Partial<InsertSection>, ownerId: string): Promise<Section | undefined>;
  deleteSection(id: string, ownerId: string): Promise<boolean>;

  // User-specific initialization
  initUserDefaults(userId: string): Promise<void>;

  // PIN verification (user-scoped)
  verifyPin(pin: string, ownerId: string): Promise<boolean>;

  // Personal Notes methods
  getPersonalNotes(ownerId: string): Promise<PersonalNotes | undefined>;
  updatePersonalNotes(notes: Partial<InsertPersonalNotes>, ownerId: string): Promise<PersonalNotes>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private notes: Map<string, Note>;
  private tasks: Map<string, Task>;
  private taskNotes: Map<string, TaskNote>;
  private attachments: Map<string, Attachment>;
  private settings: Map<string, Settings>; // Per-user settings
  private sections: Map<string, Section>;
  private personalNotes: Map<string, PersonalNotes>; // Per-user personal notes

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.notes = new Map();
    this.tasks = new Map();
    this.taskNotes = new Map();
    this.attachments = new Map();
    this.settings = new Map(); // Per-user settings map
    this.sections = new Map();
    this.personalNotes = new Map(); // Per-user personal notes map
    
    // Initialize with default admin user (password will be hashed)
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    const adminUserId = randomUUID();
    const adminUser: User = {
      id: adminUserId,
      username: "admin",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    // Initialize default settings for admin user
    const adminSettings: Settings = {
      id: randomUUID(),
      ownerId: adminUserId,
      ordersSectionName: "طلبات الكهرباء",
      tasksSectionName: "قسم إدارة المهام",
      backgroundColor: "#ffffff",
      pinHash: null,
      allowGuest: "true",
      companyLogo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.settings.set(adminUserId, adminSettings);

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
        ownerId: adminUserId,
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
        ownerId: adminUserId,
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
        ownerId: adminUserId,
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
    const hashedPassword = bcrypt.hashSync(insertUser.password, 10);
    const user: User = { 
      ...insertUser, 
      password: hashedPassword,
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

    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = bcrypt.hashSync(updateData.password, 10);
    }

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

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Order methods
  async getAllOrders(ownerId: string): Promise<Order[]> {
    const orders = Array.from(this.orders.values()).filter(order => order.ownerId === ownerId);
    return orders.sort((a, b) => {
      const dateB = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateA = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateA - dateB;
    });
  }

  async getOrder(id: string, ownerId: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order || order.ownerId !== ownerId) {
      return undefined;
    }
    return order;
  }

  async createOrder(insertOrder: InsertOrder, ownerId: string): Promise<Order> {
    const id = randomUUID();
    const now = new Date();
    const order: Order = { 
      id,
      ownerId,
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

  async updateOrder(id: string, updateData: Partial<InsertOrder>, ownerId: string): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder || existingOrder.ownerId !== ownerId) return undefined;

    const updatedOrder: Order = {
      ...existingOrder,
      ...updateData,
      updatedAt: new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string, ownerId: string): Promise<boolean> {
    const order = this.orders.get(id);
    if (!order || order.ownerId !== ownerId) return false;
    
    const deleted = this.orders.delete(id);
    // Also delete associated notes belonging to the same owner
    const orderNotes = Array.from(this.notes.values()).filter(note => 
      note.orderId === id && note.ownerId === ownerId
    );
    orderNotes.forEach(note => this.notes.delete(note.id));
    return deleted;
  }

  // Note methods
  async getNotesByOrderId(orderId: string, ownerId: string): Promise<Note[]> {
    // Verify the order belongs to the user before returning notes
    const order = await this.getOrder(orderId, ownerId);
    if (!order) return [];
    
    return Array.from(this.notes.values()).filter(note => 
      note.orderId === orderId && note.ownerId === ownerId
    );
  }

  async getNote(id: string, ownerId: string): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note || note.ownerId !== ownerId) {
      return undefined;
    }
    return note;
  }

  async createNote(insertNote: InsertNote, ownerId: string): Promise<Note> {
    // Verify the order belongs to the user
    const order = await this.getOrder(insertNote.orderId, ownerId);
    if (!order) {
      throw new Error("Order not found or access denied");
    }
    
    const id = randomUUID();
    const now = new Date();
    const note: Note = { 
      ...insertNote, 
      id,
      ownerId,
      createdAt: now,
      updatedAt: now
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updateData: Partial<InsertNote>, ownerId: string): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote || existingNote.ownerId !== ownerId) return undefined;

    const updatedNote: Note = {
      ...existingNote,
      ...updateData,
      updatedAt: new Date()
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string, ownerId: string): Promise<boolean> {
    const note = this.notes.get(id);
    if (!note || note.ownerId !== ownerId) return false;
    return this.notes.delete(id);
  }

  // Task methods
  async getAllTasks(ownerId: string): Promise<Task[]> {
    const tasks = Array.from(this.tasks.values()).filter(task => task.ownerId === ownerId);
    return tasks.sort((a, b) => {
      const dateB = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateA = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateA - dateB;
    });
  }

  async getTask(id: string, ownerId: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task || task.ownerId !== ownerId) {
      return undefined;
    }
    return task;
  }

  async createTask(insertTask: InsertTask, ownerId: string): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = { 
      id,
      ownerId,
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

  async updateTask(id: string, updateData: Partial<InsertTask>, ownerId: string): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask || existingTask.ownerId !== ownerId) return undefined;

    const updatedTask: Task = {
      ...existingTask,
      ...updateData,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string, ownerId: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task || task.ownerId !== ownerId) return false;
    
    const deleted = this.tasks.delete(id);
    // Also delete associated task notes and attachments belonging to the same owner
    const relatedTaskNotes = Array.from(this.taskNotes.values()).filter(note => 
      note.taskId === id && note.ownerId === ownerId
    );
    relatedTaskNotes.forEach(note => this.taskNotes.delete(note.id));
    
    const relatedAttachments = Array.from(this.attachments.values()).filter(attachment => 
      attachment.taskId === id && attachment.ownerId === ownerId
    );
    relatedAttachments.forEach(attachment => this.attachments.delete(attachment.id));
    
    return deleted;
  }

  // Task Note methods
  async getTaskNotesByTaskId(taskId: string, ownerId: string): Promise<TaskNote[]> {
    // Verify the task belongs to the user before returning notes
    const task = await this.getTask(taskId, ownerId);
    if (!task) return [];
    
    return Array.from(this.taskNotes.values()).filter(note => 
      note.taskId === taskId && note.ownerId === ownerId
    );
  }

  async getTaskNote(id: string, ownerId: string): Promise<TaskNote | undefined> {
    const taskNote = this.taskNotes.get(id);
    if (!taskNote || taskNote.ownerId !== ownerId) {
      return undefined;
    }
    return taskNote;
  }

  async createTaskNote(insertTaskNote: InsertTaskNote, ownerId: string): Promise<TaskNote> {
    // Verify the task belongs to the user
    const task = await this.getTask(insertTaskNote.taskId, ownerId);
    if (!task) {
      throw new Error("Task not found or access denied");
    }
    
    const id = randomUUID();
    const now = new Date();
    const taskNote: TaskNote = { 
      ...insertTaskNote, 
      id,
      ownerId,
      createdAt: now,
      updatedAt: now
    };
    this.taskNotes.set(id, taskNote);
    return taskNote;
  }

  async updateTaskNote(id: string, updateData: Partial<InsertTaskNote>, ownerId: string): Promise<TaskNote | undefined> {
    const existingNote = this.taskNotes.get(id);
    if (!existingNote || existingNote.ownerId !== ownerId) return undefined;

    const updatedNote: TaskNote = {
      ...existingNote,
      ...updateData,
      updatedAt: new Date()
    };
    this.taskNotes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteTaskNote(id: string, ownerId: string): Promise<boolean> {
    const taskNote = this.taskNotes.get(id);
    if (!taskNote || taskNote.ownerId !== ownerId) return false;
    return this.taskNotes.delete(id);
  }

  // Attachment methods
  async getAttachmentsByTaskId(taskId: string, ownerId: string): Promise<Attachment[]> {
    // Verify the task belongs to the user before returning attachments
    const task = await this.getTask(taskId, ownerId);
    if (!task) return [];
    
    return Array.from(this.attachments.values()).filter(attachment => 
      attachment.taskId === taskId && attachment.ownerId === ownerId
    );
  }

  async getAttachment(id: string, ownerId: string): Promise<Attachment | undefined> {
    const attachment = this.attachments.get(id);
    if (!attachment || attachment.ownerId !== ownerId) {
      return undefined;
    }
    return attachment;
  }

  async createAttachment(insertAttachment: InsertAttachment, ownerId: string): Promise<Attachment> {
    // Verify the task belongs to the user
    const task = await this.getTask(insertAttachment.taskId, ownerId);
    if (!task) {
      throw new Error("Task not found or access denied");
    }
    
    const id = randomUUID();
    const attachment: Attachment = { 
      ...insertAttachment, 
      id,
      ownerId,
      createdAt: new Date()
    };
    this.attachments.set(id, attachment);
    return attachment;
  }

  async deleteAttachment(id: string, ownerId: string): Promise<boolean> {
    const attachment = this.attachments.get(id);
    if (!attachment || attachment.ownerId !== ownerId) return false;
    return this.attachments.delete(id);
  }

  // Settings methods
  async getSettings(ownerId: string): Promise<Settings | undefined> {
    return this.settings.get(ownerId);
  }

  async updateSettings(updateData: Partial<InsertSettings>, ownerId: string): Promise<Settings> {
    const existingSettings = this.settings.get(ownerId);
    
    let updatedSettings: Settings;
    if (existingSettings) {
      // Preserve existing settings and only update provided fields
      updatedSettings = {
        ...existingSettings,
        ...updateData,
        updatedAt: new Date()
      };
    } else {
      // Create new settings with defaults only for new users
      updatedSettings = {
        id: randomUUID(),
        ownerId,
        createdAt: new Date(),
        ordersSectionName: "طلبات الكهرباء",
        tasksSectionName: "قسم إدارة المهام",
        backgroundColor: "#ffffff",
        pinHash: null,
        allowGuest: "true",
        companyLogo: null,
        ...updateData,
        updatedAt: new Date()
      };
    }
    
    this.settings.set(ownerId, updatedSettings);
    return updatedSettings;
  }

  // Section methods
  async getAllSections(ownerId: string): Promise<Section[]> {
    const sections = Array.from(this.sections.values()).filter(section => section.ownerId === ownerId);
    return sections.sort((a, b) => {
      return parseInt(a.orderIndex || "0") - parseInt(b.orderIndex || "0");
    });
  }

  async getSection(id: string, ownerId: string): Promise<Section | undefined> {
    const section = this.sections.get(id);
    if (!section || section.ownerId !== ownerId) {
      return undefined;
    }
    return section;
  }

  async createSection(insertSection: InsertSection, ownerId: string): Promise<Section> {
    const id = randomUUID();
    const now = new Date();
    const section: Section = { 
      id,
      ownerId,
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

  async updateSection(id: string, updateData: Partial<InsertSection>, ownerId: string): Promise<Section | undefined> {
    const existingSection = this.sections.get(id);
    if (!existingSection || existingSection.ownerId !== ownerId) return undefined;

    const updatedSection: Section = {
      ...existingSection,
      ...updateData,
      updatedAt: new Date()
    };
    this.sections.set(id, updatedSection);
    return updatedSection;
  }

  async deleteSection(id: string, ownerId: string): Promise<boolean> {
    const section = this.sections.get(id);
    if (!section || section.ownerId !== ownerId) return false;
    return this.sections.delete(id);
  }

  // User-specific initialization
  async initUserDefaults(userId: string): Promise<void> {
    // Create default sections for the user
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

    // Create sections for the user
    for (const sectionData of defaultSections) {
      await this.createSection(sectionData, userId);
    }

    // Create default settings for the user (optional)
    const defaultSettings = {
      ordersSectionName: "طلبات الكهرباء",
      tasksSectionName: "قسم إدارة المهام",
      backgroundColor: "#ffffff",
      allowGuest: "true"
    };
    
    await this.updateSettings(defaultSettings, userId);
  }

  // PIN verification (user-scoped)
  async verifyPin(pin: string, ownerId: string): Promise<boolean> {
    const userSettings = this.settings.get(ownerId);
    if (!userSettings || !userSettings.pinHash) {
      return false; // No PIN set for this user
    }
    
    // Use bcryptjs for consistent password comparison
    const bcryptjs = require('bcryptjs');
    return bcryptjs.compareSync(pin, userSettings.pinHash);
  }
}

export const storage = new MemStorage();
