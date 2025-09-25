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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Item operations
  async getItems(filters: {
    categoryId?: number;
    regionCode?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ItemWithDetails[]> {
    const { categoryId, regionCode, search, limit = 20, offset = 0 } = filters;

    let query = db
      .select({
        item: items,
        seller: users,
        category: categories,
        likesCount: count(likes.id),
      })
      .from(items)
      .leftJoin(users, eq(items.sellerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .leftJoin(likes, eq(items.id, likes.itemId))
      .where(eq(items.status, "active"))
      .groupBy(items.id, users.id, categories.id)
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset);

    const conditions = [eq(items.status, "active")];

    if (categoryId) {
      conditions.push(eq(items.categoryId, categoryId));
    }

    if (regionCode) {
      conditions.push(eq(items.regionCode, regionCode));
    }

    if (search) {
      conditions.push(
        or(
          ilike(items.title, `%${search}%`),
          ilike(items.description, `%${search}%`)
        )!
      );
    }

    const results = await db
      .select({
        item: items,
        seller: users,
        category: categories,
      })
      .from(items)
      .leftJoin(users, eq(items.sellerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset);

    // Get likes count for each item
    const itemIds = results.map(r => r.item.id);
    const likesData = itemIds.length > 0 
      ? await db
          .select({
            itemId: likes.itemId,
            count: count(likes.id),
          })
          .from(likes)
          .where(sql`${likes.itemId} IN (${sql.join(itemIds, sql`, `)})`)
          .groupBy(likes.itemId)
      : [];

    const likesMap = new Map(likesData.map(l => [l.itemId, l.count]));

    return results.map(result => ({
      ...result.item,
      seller: result.seller!,
      category: result.category!,
      likes: [],
      _count: {
        likes: likesMap.get(result.item.id) || 0,
        chats: 0,
      },
    }));
  }

  async getItemById(id: number, userId?: string): Promise<ItemWithDetails | undefined> {
    const [result] = await db
      .select({
        item: items,
        seller: users,
        category: categories,
      })
      .from(items)
      .leftJoin(users, eq(items.sellerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.id, id));

    if (!result) return undefined;

    // Get likes count and user's like status
    const [likesCount] = await db
      .select({ count: count(likes.id) })
      .from(likes)
      .where(eq(likes.itemId, id));

    let isLiked = false;
    if (userId) {
      const [userLike] = await db
        .select()
        .from(likes)
        .where(and(eq(likes.itemId, id), eq(likes.userId, userId)));
      isLiked = !!userLike;
    }

    return {
      ...result.item,
      seller: result.seller!,
      category: result.category!,
      likes: [],
      _count: {
        likes: likesCount.count,
        chats: 0,
      },
      isLiked,
    };
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    return newItem;
  }

  async updateItemViews(id: number): Promise<void> {
    await db
      .update(items)
      .set({ views: sql`${items.views} + 1` })
      .where(eq(items.id, id));
  }

  // Like operations
  async getLikesByUser(userId: string): Promise<ItemWithDetails[]> {
    const results = await db
      .select({
        item: items,
        seller: users,
        category: categories,
      })
      .from(likes)
      .leftJoin(items, eq(likes.itemId, items.id))
      .leftJoin(users, eq(items.sellerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt));

    return results.map(result => ({
      ...result.item!,
      seller: result.seller!,
      category: result.category!,
      likes: [],
      _count: {
        likes: 0,
        chats: 0,
      },
      isLiked: true,
    }));
  }

  async toggleLike(userId: string, itemId: number): Promise<{ isLiked: boolean }> {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.itemId, itemId)));

    if (existingLike) {
      await db
        .delete(likes)
        .where(and(eq(likes.userId, userId), eq(likes.itemId, itemId)));
      return { isLiked: false };
    } else {
      await db.insert(likes).values({ userId, itemId });
      return { isLiked: true };
    }
  }

  // Chat operations
  async getChatsByUser(userId: string): Promise<ChatWithDetails[]> {
    const results = await db
      .select({
        chat: chats,
        item: items,
        seller: users,
        buyer: {
          id: sql<string>`buyer.id`,
          email: sql<string>`buyer.email`,
          nickname: sql<string>`buyer.nickname`,
          profileImageUrl: sql<string>`buyer.profile_image_url`,
        },
      })
      .from(chats)
      .leftJoin(items, eq(chats.itemId, items.id))
      .leftJoin(users, eq(chats.sellerId, users.id))
      .leftJoin(sql`users as buyer`, sql`${chats.buyerId} = buyer.id`)
      .where(or(eq(chats.sellerId, userId), eq(chats.buyerId, userId)))
      .orderBy(desc(chats.updatedAt));

    // Get last message for each chat
    const chatIds = results.map(r => r.chat.id);
    const lastMessages = chatIds.length > 0
      ? await db
          .select({
            chatId: messages.chatId,
            content: messages.content,
            senderId: messages.senderId,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(sql`${messages.chatId} IN (${sql.join(chatIds, sql`, `)})`)
          .orderBy(desc(messages.createdAt))
      : [];

    const lastMessageMap = new Map();
    lastMessages.forEach(msg => {
      if (!lastMessageMap.has(msg.chatId)) {
        lastMessageMap.set(msg.chatId, msg);
      }
    });

    return results.map(result => ({
      ...result.chat,
      item: result.item!,
      seller: result.seller!,
      buyer: result.buyer as User,
      messages: [],
      lastMessage: lastMessageMap.get(result.chat.id),
    }));
  }

  async getOrCreateChat(itemId: number, sellerId: string, buyerId: string): Promise<Chat> {
    const [existingChat] = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.itemId, itemId),
          eq(chats.sellerId, sellerId),
          eq(chats.buyerId, buyerId)
        )
      );

    if (existingChat) {
      return existingChat;
    }

    const [newChat] = await db
      .insert(chats)
      .values({ itemId, sellerId, buyerId })
      .returning();

    return newChat;
  }

  async getChatWithMessages(chatId: number): Promise<ChatWithDetails | undefined> {
    const [chatResult] = await db
      .select({
        chat: chats,
        item: items,
        seller: users,
        buyer: {
          id: sql<string>`buyer.id`,
          email: sql<string>`buyer.email`,
          nickname: sql<string>`buyer.nickname`,
          profileImageUrl: sql<string>`buyer.profile_image_url`,
        },
      })
      .from(chats)
      .leftJoin(items, eq(chats.itemId, items.id))
      .leftJoin(users, eq(chats.sellerId, users.id))
      .leftJoin(sql`users as buyer`, sql`${chats.buyerId} = buyer.id`)
      .where(eq(chats.id, chatId));

    if (!chatResult) return undefined;

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);

    return {
      ...chatResult.chat,
      item: chatResult.item!,
      seller: chatResult.seller!,
      buyer: chatResult.buyer as User,
      messages: chatMessages,
    };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update chat's updatedAt
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, message.chatId));

    return newMessage;
  }

  async getMessagesByChatId(chatId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }

  // Seed data
  async seedData(): Promise<void> {
    // Insert categories
    const categoryData: InsertCategory[] = [
      { name: "디지털기기", slug: "digital" },
      { name: "가구/인테리어", slug: "furniture" },
      { name: "의류", slug: "clothing" },
      { name: "도서", slug: "books" },
      { name: "스포츠/레저", slug: "sports" },
      { name: "뷰티/미용", slug: "beauty" },
      { name: "생활/가전", slug: "home" },
      { name: "기타", slug: "etc" },
    ];

    await db.insert(categories).values(categoryData).onConflictDoNothing();

    // Insert test users (if not exists)
    const testUsers: UpsertUser[] = [
      {
        id: "user1",
        email: "user1@example.com",
        nickname: "김성수",
        location: "성수동",
        phoneVerified: true,
      },
      {
        id: "user2",
        email: "user2@example.com",
        nickname: "박뚝섬",
        location: "뚝섬동",
        phoneVerified: true,
      },
      {
        id: "user3",
        email: "user3@example.com",
        nickname: "이서울숲",
        location: "서울숲",
        phoneVerified: false,
      },
    ];

    for (const user of testUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // Get categories for item creation
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));

    // Insert test items
    const testItems: InsertItem[] = [
      {
        sellerId: "user1",
        title: "Apple 맥북 프로 M2 13인치 512GB",
        description: "맥북 프로 M2 13인치 512GB 모델입니다. 사용기간 6개월 정도이고 상태 매우 좋습니다.",
        price: 1200000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "성수동",
        images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca4"],
      },
      {
        sellerId: "user2",
        title: "아이폰 14 프로 256GB 딥퍼플",
        description: "아이폰 14 프로 256GB 딥퍼플 색상입니다. 케이스 끼고 사용해서 스크래치 없어요.",
        price: 950000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "뚝섬동",
        images: ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab"],
      },
      {
        sellerId: "user1",
        title: "허만밀러 의자 새제품",
        description: "허만밀러 에어론 의자 새제품입니다. 포장도 안뜯었어요.",
        price: 450000,
        categoryId: categoryMap.get("furniture")!,
        regionCode: "성수동",
        images: ["https://images.unsplash.com/photo-1541558869434-2840d308329a"],
      },
      {
        sellerId: "user3",
        title: "IT 도서 모음 판매",
        description: "개발 관련 도서들 모음으로 판매합니다. 총 15권 정도.",
        price: 50000,
        categoryId: categoryMap.get("books")!,
        regionCode: "서울숲",
        images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570"],
      },
      {
        sellerId: "user2",
        title: "나이키 에어맥스 280",
        description: "나이키 에어맥스 280 사이즈입니다. 몇 번 안신어서 거의 새거예요.",
        price: 120000,
        categoryId: categoryMap.get("clothing")!,
        regionCode: "뚝섬동",
        images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772"],
      },
      {
        sellerId: "user1",
        title: "캐논 EOS R5 풀세트",
        description: "캐논 EOS R5 바디와 24-70mm 렌즈 풀세트입니다.",
        price: 2800000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "성수동",
        images: ["https://images.unsplash.com/photo-1606983340126-99ab4feaa64a"],
      },
    ];

    // Add more items to reach 20 total
    const additionalItems: InsertItem[] = [
      {
        sellerId: "user3",
        title: "삼성 갤럭시 S23 울트라",
        description: "삼성 갤럭시 S23 울트라 512GB 모델입니다.",
        price: 890000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "서울숲",
        images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf"],
      },
      {
        sellerId: "user2",
        title: "다이슨 청소기 V15",
        description: "다이슨 무선청소기 V15 모델입니다. 1년 사용했습니다.",
        price: 350000,
        categoryId: categoryMap.get("home")!,
        regionCode: "뚝섬동",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64"],
      },
      {
        sellerId: "user1",
        title: "로지텍 MX 마스터 3S",
        description: "로지텍 MX 마스터 3S 무선 마우스입니다.",
        price: 89000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "성수동",
        images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46"],
      },
      {
        sellerId: "user3",
        title: "이케아 책상 BEKANT",
        description: "이케아 BEKANT 책상 화이트색상입니다. 조립완료 상태.",
        price: 65000,
        categoryId: categoryMap.get("furniture")!,
        regionCode: "서울숲",
        images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7"],
      },
      {
        sellerId: "user2",
        title: "아디다스 운동화 새제품",
        description: "아디다스 운동화 새제품입니다. 선물받았는데 사이즈가 안맞아요.",
        price: 95000,
        categoryId: categoryMap.get("clothing")!,
        regionCode: "뚝섬동",
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff"],
      },
      {
        sellerId: "user1",
        title: "프라다 가방 정품",
        description: "프라다 사피아노 토트백 정품입니다. 구매증빙 있어요.",
        price: 1500000,
        categoryId: categoryMap.get("clothing")!,
        regionCode: "성수동",
        images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3"],
      },
      {
        sellerId: "user3",
        title: "요가매트 + 요가블록 세트",
        description: "요가매트와 요가블록 세트로 판매합니다. 몇번 안썼어요.",
        price: 35000,
        categoryId: categoryMap.get("sports")!,
        regionCode: "서울숲",
        images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b"],
      },
      {
        sellerId: "user2",
        title: "LG 모니터 27인치 4K",
        description: "LG 27인치 4K 모니터입니다. USB-C 지원해요.",
        price: 420000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "뚝섬동",
        images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"],
      },
      {
        sellerId: "user1",
        title: "소니 노이즈캔슬링 헤드폰",
        description: "소니 WH-1000XM5 노이즈캔슬링 헤드폰입니다.",
        price: 280000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "성수동",
        images: ["https://images.unsplash.com/photo-1484704849700-f032a568e944"],
      },
      {
        sellerId: "user3",
        title: "무인양품 수납함 세트",
        description: "무인양품 폴리프로필렌 수납함 여러개 세트로 판매해요.",
        price: 85000,
        categoryId: categoryMap.get("home")!,
        regionCode: "서울숲",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64"],
      },
      {
        sellerId: "user2",
        title: "아이패드 에어 5세대",
        description: "아이패드 에어 5세대 64GB 모델입니다. 애플펜슬 포함.",
        price: 650000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "뚝섬동",
        images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0"],
      },
      {
        sellerId: "user1",
        title: "조던 1 하이 시카고",
        description: "에어조던 1 하이 시카고 색상입니다. 사이즈 270.",
        price: 180000,
        categoryId: categoryMap.get("clothing")!,
        regionCode: "성수동",
        images: ["https://images.unsplash.com/photo-1460353581641-37baddab0fa2"],
      },
      {
        sellerId: "user3",
        title: "닌텐도 스위치 OLED",
        description: "닌텐도 스위치 OLED 모델입니다. 게임 몇개 포함해서 드려요.",
        price: 320000,
        categoryId: categoryMap.get("digital")!,
        regionCode: "서울숲",
        images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3"],
      },
      {
        sellerId: "user2",
        title: "바디프랜드 안마의자",
        description: "바디프랜드 안마의자입니다. 이사가서 급매로 내놓아요.",
        price: 1200000,
        categoryId: categoryMap.get("home")!,
        regionCode: "뚝섬동",
        images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7"],
      }
    ];

    await db.insert(items).values([...testItems, ...additionalItems]).onConflictDoNothing();
  }
}

export const storage = new DatabaseStorage();
