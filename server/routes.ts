import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMerchantSchema, insertCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { campaignWorker } from "./campaign-worker";

declare module "express-session" {
  interface SessionData {
    merchantId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session.merchantId) {
    return res.status(401).json({ error: "غير مصرح" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertMerchantSchema.parse(req.body);
      
      const existingUsername = await storage.getMerchantByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ error: "اسم المستخدم موجود بالفعل" });
      }
      
      const existingEmail = await storage.getMerchantByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "البريد الإلكتروني موجود بالفعل" });
      }
      
      const merchant = await storage.createMerchant(data);
      req.session.merchantId = merchant.id;
      
      const { password, ...merchantData } = merchant;
      res.json(merchantData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء إنشاء الحساب" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const merchant = await storage.getMerchantByUsername(username);
      if (!merchant) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      
      const isValid = await storage.verifyPassword(password, merchant.password);
      if (!isValid) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      
      req.session.merchantId = merchant.id;
      
      const { password: _, ...merchantData } = merchant;
      res.json(merchantData);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.merchantId) {
      return res.status(401).json({ error: "غير مصرح" });
    }
    
    const merchant = await storage.getMerchant(req.session.merchantId);
    if (!merchant) {
      return res.status(401).json({ error: "غير مصرح" });
    }
    
    const { password, ...merchantData } = merchant;
    res.json(merchantData);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "حدث خطأ أثناء تسجيل الخروج" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/accounts", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getAccountsByMerchant(req.session.merchantId!);
      res.json(accounts);
    } catch (error) {
      console.error("Get accounts error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء جلب الحسابات" });
    }
  });

  app.post("/api/accounts", requireAuth, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
      }
      
      const account = await storage.createAccount(req.session.merchantId!, { username, password });
      res.json(account);
    } catch (error) {
      console.error("Create account error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء إضافة الحساب" });
    }
  });

  app.delete("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      const account = await storage.getAccount(req.params.id);
      if (!account || account.merchantId !== req.session.merchantId) {
        return res.status(404).json({ error: "الحساب غير موجود" });
      }
      
      await storage.deleteAccount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء حذف الحساب" });
    }
  });

  app.get("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const campaigns = await storage.getCampaignsByMerchant(req.session.merchantId!);
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء جلب الحملات" });
    }
  });

  app.post("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(req.session.merchantId!, data);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء إنشاء الحملة" });
    }
  });

  app.patch("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign || campaign.merchantId !== req.session.merchantId) {
        return res.status(404).json({ error: "الحملة غير موجودة" });
      }
      
      const updated = await storage.updateCampaign(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء تحديث الحملة" });
    }
  });

  app.delete("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign || campaign.merchantId !== req.session.merchantId) {
        return res.status(404).json({ error: "الحملة غير موجودة" });
      }
      
      await storage.deleteCampaign(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete campaign error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء حذف الحملة" });
    }
  });

  app.get("/api/worker/status", requireAuth, async (req, res) => {
    try {
      const status = campaignWorker.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Get worker status error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء جلب حالة العامل" });
    }
  });

  app.post("/api/worker/start", requireAuth, async (req, res) => {
    try {
      campaignWorker.start();
      res.json({ success: true, message: "تم بدء العامل" });
    } catch (error) {
      console.error("Start worker error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء بدء العامل" });
    }
  });

  app.post("/api/worker/stop", requireAuth, async (req, res) => {
    try {
      await campaignWorker.stop();
      res.json({ success: true, message: "تم إيقاف العامل" });
    } catch (error) {
      console.error("Stop worker error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء إيقاف العامل" });
    }
  });

  return httpServer;
}
