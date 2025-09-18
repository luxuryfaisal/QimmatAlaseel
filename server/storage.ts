import { type User, type InsertUser, type Order, type InsertOrder, type Note, type InsertNote } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private notes: Map<string, Note>;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.notes = new Map();
    
    // Initialize with default admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "admin123"
    };
    this.users.set(adminUser.id, adminUser);

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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();
