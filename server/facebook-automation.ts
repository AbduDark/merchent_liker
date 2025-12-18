import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "puppeteer";

puppeteer.use(StealthPlugin());

interface FacebookCredentials {
  username: string;
  password: string;
}

interface LikeResult {
  success: boolean;
  error?: string;
}

export class FacebookAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn: boolean = false;

  async initialize(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-130.0.6723.91/bin/chromium",
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
  }

  async login(credentials: FacebookCredentials): Promise<boolean> {
    if (!this.page) {
      await this.initialize();
    }

    try {
      console.log(`[FB] Logging in with account: ${credentials.username}`);
      
      await this.page!.goto("https://www.facebook.com/", { 
        waitUntil: "networkidle2",
        timeout: 30000 
      });

      await this.delay(2000);

      const cookieButton = await this.page!.$('[data-cookiebanner="accept_button"]');
      if (cookieButton) {
        await cookieButton.click();
        await this.delay(1000);
      }

      await this.page!.type('input[name="email"]', credentials.username, { delay: 100 });
      await this.page!.type('input[name="pass"]', credentials.password, { delay: 100 });

      await Promise.all([
        this.page!.click('button[name="login"]'),
        this.page!.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
      ]);

      await this.delay(3000);

      const currentUrl = this.page!.url();
      
      if (currentUrl.includes("checkpoint") || currentUrl.includes("login")) {
        console.log(`[FB] Login failed - checkpoint or still on login page`);
        this.isLoggedIn = false;
        return false;
      }

      this.isLoggedIn = true;
      console.log(`[FB] Login successful for: ${credentials.username}`);
      return true;
    } catch (error) {
      console.error(`[FB] Login error:`, error);
      this.isLoggedIn = false;
      return false;
    }
  }

  async likePost(postUrl: string): Promise<LikeResult> {
    if (!this.page || !this.isLoggedIn) {
      return { success: false, error: "Not logged in" };
    }

    try {
      console.log(`[FB] Navigating to post: ${postUrl}`);
      
      await this.page.goto(postUrl, { 
        waitUntil: "networkidle2",
        timeout: 30000 
      });

      await this.delay(3000);

      const likeButtonSelectors = [
        '[aria-label="Like"]',
        '[aria-label="أعجبني"]',
        'div[aria-label*="Like"]',
        'div[aria-label*="أعجبني"]',
        'span[data-testid="UFI2ReactionsCount/root"]',
        'div[data-testid="UFI2ReactionLink"]',
      ];

      let likeButton = null;
      for (const selector of likeButtonSelectors) {
        likeButton = await this.page.$(selector);
        if (likeButton) {
          console.log(`[FB] Found like button with selector: ${selector}`);
          break;
        }
      }

      if (!likeButton) {
        const allButtons = await this.page.$$('div[role="button"]');
        for (const button of allButtons) {
          const ariaLabel = await button.evaluate(el => el.getAttribute('aria-label'));
          if (ariaLabel && (ariaLabel.includes('Like') || ariaLabel.includes('أعجبني'))) {
            likeButton = button;
            break;
          }
        }
      }

      if (!likeButton) {
        console.log(`[FB] Like button not found`);
        return { success: false, error: "Like button not found" };
      }

      await likeButton.click();
      await this.delay(2000);

      console.log(`[FB] Successfully liked post`);
      return { success: true };
    } catch (error) {
      console.error(`[FB] Like error:`, error);
      return { success: false, error: String(error) };
    }
  }

  async addComment(postUrl: string, commentText: string): Promise<LikeResult> {
    if (!this.page || !this.isLoggedIn) {
      return { success: false, error: "Not logged in" };
    }

    try {
      console.log(`[FB] Adding comment to post: ${postUrl}`);

      if (!this.page.url().includes(postUrl)) {
        await this.page.goto(postUrl, { 
          waitUntil: "networkidle2",
          timeout: 30000 
        });
        await this.delay(3000);
      }

      const commentBoxSelectors = [
        'div[aria-label="Write a comment"]',
        'div[aria-label="اكتب تعليقاً..."]',
        'div[contenteditable="true"][role="textbox"]',
        'textarea[name="comment_text"]',
      ];

      let commentBox = null;
      for (const selector of commentBoxSelectors) {
        commentBox = await this.page.$(selector);
        if (commentBox) {
          console.log(`[FB] Found comment box with selector: ${selector}`);
          break;
        }
      }

      if (!commentBox) {
        return { success: false, error: "Comment box not found" };
      }

      await commentBox.click();
      await this.delay(500);

      await this.page.keyboard.type(commentText, { delay: 50 });
      await this.delay(1000);

      await this.page.keyboard.press("Enter");
      await this.delay(2000);

      console.log(`[FB] Successfully added comment`);
      return { success: true };
    } catch (error) {
      console.error(`[FB] Comment error:`, error);
      return { success: false, error: String(error) };
    }
  }

  async logout(): Promise<void> {
    if (!this.page) return;

    try {
      await this.page.goto("https://www.facebook.com/logout");
      await this.delay(2000);
    } catch (error) {
      console.error(`[FB] Logout error:`, error);
    }

    this.isLoggedIn = false;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const facebookAutomation = new FacebookAutomation();
