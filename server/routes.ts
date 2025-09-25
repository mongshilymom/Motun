import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertItemSchema, insertMessageSchema } from "@shared/schema";
import multer from "multer";
import sharp from "sharp";
import { z } from "zod";

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Items
  app.get("/api/items", async (req, res) => {
    try {
      const { categoryId, regionCode, search, page = "1", limit = "20" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const filters = {
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        regionCode: regionCode as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset,
      };

      const items = await storage.getItems(filters);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = (req.user as any)?.claims?.sub;
      
      const item = await storage.getItemById(itemId, userId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Update view count
      await storage.updateItemViews(itemId);
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", isAuthenticated, upload.array('images', 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];
      
      // Process images and create thumbnails
      const imageUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          // Generate thumbnail using sharp
          const thumbnailBuffer = await sharp(file.buffer)
            .resize(512, 512, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toBuffer();

          // In production, upload to Replit Object Storage
          // For now, using placeholder URLs
          const imageUrl = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
          imageUrls.push(imageUrl);
        }
      }

      const itemData = {
        ...req.body,
        sellerId: userId,
        price: parseInt(req.body.price),
        categoryId: parseInt(req.body.categoryId),
        images: imageUrls,
        regionCode: req.body.regionCode || "성수동",
      };

      const validatedData = insertItemSchema.parse(itemData);
      const newItem = await storage.createItem(validatedData);
      
      res.json(newItem);
    } catch (error) {
      console.error("Error creating item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  // Likes
  app.get("/api/likes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const likedItems = await storage.getLikesByUser(userId);
      res.json(likedItems);
    } catch (error) {
      console.error("Error fetching likes:", error);
      res.status(500).json({ message: "Failed to fetch likes" });
    }
  });

  app.post("/api/likes/:itemId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemId = parseInt(req.params.itemId);
      
      const result = await storage.toggleLike(userId, itemId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Chats
  app.get("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chats = await storage.getChatsByUser(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemId, sellerId } = req.body;
      
      const chat = await storage.getOrCreateChat(itemId, sellerId, userId);
      res.json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get("/api/chats/:id", isAuthenticated, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChatWithMessages(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  app.post("/api/chats/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatId = parseInt(req.params.id);
      
      const messageData = {
        ...req.body,
        chatId,
        senderId: userId,
      };

      const validatedData = insertMessageSchema.parse(messageData);
      const newMessage = await storage.createMessage(validatedData);
      
      // Broadcast to WebSocket clients
      broadcastMessage(chatId, newMessage);
      
      res.json(newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Seed data endpoint (development only)
  if (process.env.NODE_ENV === "development") {
    app.post("/api/seed", async (req, res) => {
      try {
        await storage.seedData();
        res.json({ message: "Seed data created successfully" });
      } catch (error) {
        console.error("Error seeding data:", error);
        res.status(500).json({ message: "Failed to seed data" });
      }
    });
  }

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocket[]>();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'join_chat') {
          const chatId = message.chatId.toString();
          if (!clients.has(chatId)) {
            clients.set(chatId, []);
          }
          clients.get(chatId)!.push(ws);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from all chat rooms
      for (const [chatId, chatClients] of Array.from(clients.entries())) {
        const index = chatClients.indexOf(ws);
        if (index !== -1) {
          chatClients.splice(index, 1);
          if (chatClients.length === 0) {
            clients.delete(chatId);
          }
        }
      }
    });
  });

  function broadcastMessage(chatId: number, message: any) {
    const chatClients = clients.get(chatId.toString());
    if (chatClients) {
      const messageData = JSON.stringify({
        type: 'new_message',
        message,
      });
      
      chatClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageData);
        }
      });
    }
  }

  return httpServer;
}
