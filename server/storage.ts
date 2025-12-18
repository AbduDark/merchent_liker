import { 
  merchants, 
  socialAccounts, 
  campaigns,
  type Merchant, 
  type InsertMerchant,
  type SocialAccount,
  type InsertSocialAccount,
  type Campaign,
  type InsertCampaign
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";

if (!process.env.SESSION_SECRET) {
  console.warn("WARNING: SESSION_SECRET not set. Using default key - DO NOT USE IN PRODUCTION!");
}

const ENCRYPTION_KEY = process.env.SESSION_SECRET || "campaign-pro-dev-key-32-chars!!";

function encrypt(text: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface IStorage {
  getMerchant(id: string): Promise<Merchant | undefined>;
  getMerchantByUsername(username: string): Promise<Merchant | undefined>;
  getMerchantByEmail(email: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  
  getAccountsByMerchant(merchantId: string): Promise<SocialAccount[]>;
  getAccount(id: string): Promise<SocialAccount | undefined>;
  createAccount(merchantId: string, account: { username: string; password: string }): Promise<SocialAccount>;
  deleteAccount(id: string): Promise<void>;
  
  getCampaignsByMerchant(merchantId: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(merchantId: string, campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMerchant(id: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant || undefined;
  }

  async getMerchantByUsername(username: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.username, username));
    return merchant || undefined;
  }

  async getMerchantByEmail(email: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.email, email));
    return merchant || undefined;
  }

  async createMerchant(insertMerchant: InsertMerchant): Promise<Merchant> {
    const hashedPassword = await this.hashPassword(insertMerchant.password);
    const [merchant] = await db
      .insert(merchants)
      .values({ ...insertMerchant, password: hashedPassword })
      .returning();
    return merchant;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async getAccountsByMerchant(merchantId: string): Promise<SocialAccount[]> {
    return db.select().from(socialAccounts).where(eq(socialAccounts.merchantId, merchantId));
  }

  async getAccount(id: string): Promise<SocialAccount | undefined> {
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id));
    return account || undefined;
  }

  async createAccount(merchantId: string, account: { username: string; password: string }): Promise<SocialAccount> {
    const encryptedPassword = encrypt(account.password);
    const [newAccount] = await db
      .insert(socialAccounts)
      .values({
        merchantId,
        username: account.username,
        encryptedPassword,
      })
      .returning();
    return newAccount;
  }

  async deleteAccount(id: string): Promise<void> {
    await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
  }

  async getCampaignsByMerchant(merchantId: string): Promise<Campaign[]> {
    return db.select().from(campaigns).where(eq(campaigns.merchantId, merchantId));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(merchantId: string, campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        merchantId,
        ...campaign,
      })
      .returning();
    return newCampaign;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined> {
    const [updated] = await db
      .update(campaigns)
      .set(data)
      .where(eq(campaigns.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }
}

export const storage = new DatabaseStorage();
