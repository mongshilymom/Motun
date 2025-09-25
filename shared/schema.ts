import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  nickname: varchar("nickname"),
  location: varchar("location").default("성수동"), // 행정동 단위
  phoneVerified: boolean("phone_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Items table
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  regionCode: varchar("region_code").notNull(), // 행정동 코드
  images: text("images").array().default([]), // Array of image URLs
  status: varchar("status").default("active"), // active, sold, hidden
  views: integer("views").default(0),
  isNegotiable: boolean("is_negotiable").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Likes table
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chats table
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // text, image
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  likes: many(likes),
  sentMessages: many(messages),
  sellerChats: many(chats, { relationName: "seller" }),
  buyerChats: many(chats, { relationName: "buyer" }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  seller: one(users, {
    fields: [items.sellerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  likes: many(likes),
  chats: many(chats),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [likes.itemId],
    references: [items.id],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  item: one(items, {
    fields: [chats.itemId],
    references: [items.id],
  }),
  seller: one(users, {
    fields: [chats.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  buyer: one(users, {
    fields: [chats.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Extended types with relations
export type ItemWithDetails = Item & {
  seller: User;
  category: Category;
  likes: Like[];
  _count?: {
    likes: number;
    chats: number;
  };
  isLiked?: boolean;
};

export type ChatWithDetails = Chat & {
  item: Item;
  seller: User;
  buyer: User;
  messages: Message[];
  lastMessage?: Message;
};
