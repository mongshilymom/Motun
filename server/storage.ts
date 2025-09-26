import {
  users,
  items,
  categories,
  likes,
  chats,
  messages,
  type User,
  type UpsertUser,
  type Item,
  type InsertItem,
  type ItemWithDetails,
  type Category,
  type InsertCategory,
  type Like,
  type InsertLike,
  type Chat,
  type InsertChat,
  type ChatWithDetails,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql, count } from "drizzle-orm";
// Replit Object Storage 클라이언트를 import 합니다. (추가된 부분)
import { Client } from 'object-storage';

// Object Storage 클라이언트를 초기화합니다. (추가된 부분)
// bucket과 region 정보는 Replit Secrets에서 자동으로 가져옵니다.
const objectStorageClient = new Client();

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Item operations
  getItems(filters?: {
    categoryId?: number;
    regionCode?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ItemWithDetails[]>;
  getItemById(id: number, userId?: string): Promise<ItemWithDetails | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItemViews(id: number): Promise<void>;

  // Like operations
  getLikesByUser(userId: string): Promise<ItemWithDetails[]>;
  toggleLike(userId: string, itemId: number): Promise<{ isLiked: boolean }>;

  // Chat operations
  getChatsByUser(userId: string): Promise<ChatWithDetails[]>;
  getOrCreateChat(itemId: number, sellerId: string, buyerId: string): Promise<Chat>;
  getChatWithMessages(chatId: number): Promise<ChatWithDetails | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByChatId(chatId: number): Promise<Message[]>;

  // Seed operations
  seedData(): Promise<void>;

  // Object Storage operations (추가된
