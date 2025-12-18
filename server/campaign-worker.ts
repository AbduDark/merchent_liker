import { storage, decrypt } from "./storage";
import { FacebookAutomation } from "./facebook-automation";
import type { Campaign, SocialAccount } from "@shared/schema";

interface WorkerStatus {
  isRunning: boolean;
  currentCampaignId: string | null;
  currentAccountId: string | null;
  lastError: string | null;
  processedLikes: number;
  processedComments: number;
}

class CampaignWorker {
  private isRunning: boolean = false;
  private shouldStop: boolean = false;
  private currentCampaignId: string | null = null;
  private currentAccountId: string | null = null;
  private lastError: string | null = null;
  private processedLikes: number = 0;
  private processedComments: number = 0;
  private automationInstances: Map<string, FacebookAutomation> = new Map();

  getStatus(): WorkerStatus {
    return {
      isRunning: this.isRunning,
      currentCampaignId: this.currentCampaignId,
      currentAccountId: this.currentAccountId,
      lastError: this.lastError,
      processedLikes: this.processedLikes,
      processedComments: this.processedComments,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[Worker] Already running");
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.lastError = null;
    console.log("[Worker] Starting campaign worker...");

    await this.processLoop();
  }

  async stop(): Promise<void> {
    console.log("[Worker] Stopping campaign worker...");
    this.shouldStop = true;
    
    const entries = Array.from(this.automationInstances.entries());
    for (let i = 0; i < entries.length; i++) {
      const [accountId, automation] = entries[i];
      try {
        await automation.close();
      } catch (e) {
        console.error(`[Worker] Error closing automation for account ${accountId}:`, e);
      }
    }
    this.automationInstances.clear();
    
    this.isRunning = false;
    this.currentCampaignId = null;
    this.currentAccountId = null;
  }

  private async processLoop(): Promise<void> {
    while (!this.shouldStop) {
      try {
        const activeCampaigns = await storage.getActiveCampaigns();
        
        if (activeCampaigns.length === 0) {
          console.log("[Worker] No active campaigns found. Waiting...");
          await this.delay(10000);
          continue;
        }

        for (const campaign of activeCampaigns) {
          if (this.shouldStop) break;
          
          await this.processCampaign(campaign);
        }

        await this.delay(5000);
      } catch (error) {
        console.error("[Worker] Error in process loop:", error);
        this.lastError = String(error);
        await this.delay(10000);
      }
    }

    this.isRunning = false;
    console.log("[Worker] Worker stopped");
  }

  private async processCampaign(campaign: Campaign): Promise<void> {
    this.currentCampaignId = campaign.id;
    console.log(`[Worker] Processing campaign: ${campaign.id} - ${campaign.postUrl}`);

    const needsLikes = (campaign.currentLikes || 0) < (campaign.targetLikes || 0);
    const needsComments = (campaign.currentComments || 0) < (campaign.targetComments || 0);

    if (!needsLikes && !needsComments) {
      console.log(`[Worker] Campaign ${campaign.id} is complete. Marking as completed.`);
      await storage.updateCampaign(campaign.id, { status: "completed" });
      return;
    }

    const accounts = await storage.getAccountsByMerchant(campaign.merchantId);
    const activeAccounts = accounts.filter(a => a.status === "active");

    if (activeAccounts.length === 0) {
      console.log(`[Worker] No active accounts for campaign ${campaign.id}`);
      this.lastError = "No active accounts available";
      return;
    }

    for (const account of activeAccounts) {
      if (this.shouldStop) break;
      
      const currentCampaign = await storage.getCampaign(campaign.id);
      if (!currentCampaign || currentCampaign.status !== "active") {
        break;
      }

      const stillNeedsLikes = (currentCampaign.currentLikes || 0) < (currentCampaign.targetLikes || 0);
      const stillNeedsComments = (currentCampaign.currentComments || 0) < (currentCampaign.targetComments || 0);

      if (!stillNeedsLikes && !stillNeedsComments) {
        console.log(`[Worker] Campaign ${campaign.id} completed during processing`);
        await storage.updateCampaign(campaign.id, { status: "completed" });
        break;
      }

      await this.processWithAccount(currentCampaign, account, stillNeedsLikes, stillNeedsComments);
    }

    this.currentCampaignId = null;
  }

  private async processWithAccount(
    campaign: Campaign, 
    account: SocialAccount, 
    doLike: boolean, 
    doComment: boolean
  ): Promise<void> {
    this.currentAccountId = account.id;
    console.log(`[Worker] Using account: ${account.username}`);

    let automation = this.automationInstances.get(account.id);
    
    if (!automation) {
      automation = new FacebookAutomation();
      
      try {
        await automation.initialize();
        
        const password = decrypt(account.encryptedPassword);
        const loginSuccess = await automation.login({
          username: account.username,
          password: password,
        });

        if (!loginSuccess) {
          console.log(`[Worker] Login failed for account: ${account.username}`);
          await storage.updateAccountStatus(account.id, "error");
          await automation.close();
          this.currentAccountId = null;
          return;
        }

        this.automationInstances.set(account.id, automation);
        await storage.updateAccountStatus(account.id, "active");
      } catch (error) {
        console.error(`[Worker] Error initializing account ${account.username}:`, error);
        await storage.updateAccountStatus(account.id, "error");
        await automation.close();
        this.currentAccountId = null;
        return;
      }
    }

    try {
      if (doLike) {
        const likeResult = await automation.likePost(campaign.postUrl);
        
        if (likeResult.success) {
          this.processedLikes++;
          const newLikes = (campaign.currentLikes || 0) + 1;
          await storage.updateCampaign(campaign.id, { currentLikes: newLikes });
          console.log(`[Worker] Like successful. New count: ${newLikes}/${campaign.targetLikes}`);
        } else {
          console.log(`[Worker] Like failed: ${likeResult.error}`);
        }
      }

      if (doComment && campaign.commentText) {
        const commentResult = await automation.addComment(campaign.postUrl, campaign.commentText);
        
        if (commentResult.success) {
          this.processedComments++;
          const newComments = (campaign.currentComments || 0) + 1;
          await storage.updateCampaign(campaign.id, { currentComments: newComments });
          console.log(`[Worker] Comment successful. New count: ${newComments}/${campaign.targetComments}`);
        } else {
          console.log(`[Worker] Comment failed: ${commentResult.error}`);
        }
      }

      await this.delay(5000 + Math.random() * 5000);
    } catch (error) {
      console.error(`[Worker] Error processing with account ${account.username}:`, error);
      this.lastError = String(error);
    }

    this.currentAccountId = null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const campaignWorker = new CampaignWorker();
