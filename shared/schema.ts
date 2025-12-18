import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "expired"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["pending", "active", "completed", "paused"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "inactive", "error"]);

export const merchants = pgTable("merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  businessName: text("business_name"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("inactive"),
  subscriptionPlan: text("subscription_plan"),
  campaignsLimit: integer("campaigns_limit").default(5),
  accountsLimit: integer("accounts_limit").default(10),
});

export const merchantsRelations = relations(merchants, ({ many }) => ({
  accounts: many(socialAccounts),
  campaigns: many(campaigns),
}));

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  status: accountStatusEnum("status").default("active"),
  lastUsed: timestamp("last_used"),
});

export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  merchant: one(merchants, {
    fields: [socialAccounts.merchantId],
    references: [merchants.id],
  }),
}));

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  postUrl: text("post_url").notNull(),
  targetLikes: integer("target_likes").default(0),
  targetComments: integer("target_comments").default(0),
  currentLikes: integer("current_likes").default(0),
  currentComments: integer("current_comments").default(0),
  status: campaignStatusEnum("status").default("pending"),
  commentText: text("comment_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  merchant: one(merchants, {
    fields: [campaigns.merchantId],
    references: [merchants.id],
  }),
}));

export const insertMerchantSchema = createInsertSchema(merchants).pick({
  username: true,
  email: true,
  password: true,
  businessName: true,
});

export const loginMerchantSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).pick({
  username: true,
  encryptedPassword: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  postUrl: true,
  targetLikes: true,
  targetComments: true,
  commentText: true,
});

export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
