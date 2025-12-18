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
      console.log(`[FB] Logging in with account: ${credentials.username.substring(0, 3)}***`);
      
      // Try mobile version first - more stable selectors
      await this.page!.goto("https://m.facebook.com/", { 
        waitUntil: "networkidle2",
        timeout: 60000 
      });

      await this.delay(3000);

      // Handle cookie banners with multiple selectors
      const cookieSelectors = [
        '[data-cookiebanner="accept_button"]',
        'button[data-testid="cookie-policy-manage-dialog-accept-button"]',
        'button[value="Accept All"]',
        'button[title="Accept All"]',
        '[aria-label="Accept All"]',
        'button:has-text("Accept")',
      ];
      
      for (const selector of cookieSelectors) {
        try {
          const cookieBtn = await this.page!.$(selector);
          if (cookieBtn) {
            await cookieBtn.click();
            await this.delay(1000);
            console.log(`[FB] Accepted cookies with: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Find and fill email field
      const emailSelectors = ['input[name="email"]', '#m_login_email', 'input[type="email"]', 'input[type="text"]'];
      let emailFilled = false;
      for (const selector of emailSelectors) {
        try {
          const emailInput = await this.page!.$(selector);
          if (emailInput) {
            await emailInput.click();
            await this.delay(200);
            await this.page!.keyboard.type(credentials.username, { delay: 100 });
            emailFilled = true;
            console.log(`[FB] Filled email with: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!emailFilled) {
        console.log(`[FB] Could not find email input`);
        return false;
      }
      
      await this.delay(500);

      // Find and fill password field
      const passSelectors = ['input[name="pass"]', '#m_login_password', 'input[type="password"]'];
      let passFilled = false;
      for (const selector of passSelectors) {
        try {
          const passInput = await this.page!.$(selector);
          if (passInput) {
            await passInput.click();
            await this.delay(200);
            await this.page!.keyboard.type(credentials.password, { delay: 100 });
            passFilled = true;
            console.log(`[FB] Filled password with: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!passFilled) {
        console.log(`[FB] Could not find password input`);
        return false;
      }
      
      await this.delay(1000);

      // Find and click login button with multiple selectors
      const loginButtonSelectors = [
        'button[name="login"]',
        'button[type="submit"]',
        'input[type="submit"]',
        'button[value="Log In"]',
        'input[name="login"]',
        '[data-sigil="m_login_button"]',
        'button:has-text("Log In")',
        'button:has-text("تسجيل الدخول")',
      ];
      
      let loginClicked = false;
      for (const selector of loginButtonSelectors) {
        try {
          const loginBtn = await this.page!.$(selector);
          if (loginBtn) {
            await loginBtn.click();
            loginClicked = true;
            console.log(`[FB] Clicked login with: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!loginClicked) {
        // Try pressing Enter as fallback
        await this.page!.keyboard.press('Enter');
        console.log(`[FB] Pressed Enter to submit`);
      }
      
      await this.delay(10000);

      const currentUrl = this.page!.url();
      console.log(`[FB] Current URL after login: ${currentUrl}`);
      
      if (currentUrl.includes("checkpoint")) {
        console.log(`[FB] Login failed - security checkpoint required`);
        this.isLoggedIn = false;
        return false;
      }

      if (currentUrl.includes("two_step_verification")) {
        console.log(`[FB] Login failed - 2FA required`);
        this.isLoggedIn = false;
        return false;
      }

      const homeIndicators = await this.page!.$$('[aria-label="Home"], [aria-label="الصفحة الرئيسية"]');
      if (homeIndicators.length > 0) {
        this.isLoggedIn = true;
        console.log(`[FB] Login successful - home page detected`);
        return true;
      }

      if (!currentUrl.includes("login") && !currentUrl.includes("checkpoint")) {
        this.isLoggedIn = true;
        console.log(`[FB] Login appears successful`);
        return true;
      }

      console.log(`[FB] Login failed - still on login page`);
      this.isLoggedIn = false;
      return false;
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
        waitUntil: "domcontentloaded",
        timeout: 60000 
      });

      await this.delay(8000);

      await this.page.evaluate(() => {
        window.scrollBy(0, 500);
      });
      await this.delay(3000);

      console.log(`[FB] Inspecting page for like buttons...`);
      
      const allAriaElements = await this.page.$$('[aria-label]');
      console.log(`[FB] Found ${allAriaElements.length} elements with aria-label`);
      
      for (const el of allAriaElements.slice(0, 30)) {
        const label = await el.evaluate(e => e.getAttribute('aria-label'));
        if (label && (label.toLowerCase().includes('like') || label.includes('أعجبني') || label.includes('إعجاب'))) {
          console.log(`[FB] Found aria-label: "${label}"`);
        }
      }

      const likeButtonSelectors = [
        '[aria-label="Like"]',
        '[aria-label="أعجبني"]',
        '[aria-label="إعجاب"]',
        'div[aria-label*="Like"]',
        'div[aria-label*="أعجبني"]',
        '[aria-label^="Like"]',
        'div[role="article"] [aria-label*="Like"]',
        '.UFILikeLink',
        '.likeButton',
      ];

      let likeButton = null;
      for (const selector of likeButtonSelectors) {
        try {
          likeButton = await this.page.$(selector);
          if (likeButton) {
            console.log(`[FB] Found like button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!likeButton) {
        try {
          const [xpathButton] = await this.page.$$("xpath/.//span[contains(text(), 'Like')]");
          if (xpathButton) {
            likeButton = xpathButton;
            console.log(`[FB] Found like button via XPath`);
          }
        } catch (e) {
          console.log(`[FB] XPath search failed`);
        }
      }

      if (!likeButton) {
        console.log(`[FB] Searching all clickable elements...`);
        const allClickable = await this.page.$$('[role="button"], button, a');
        console.log(`[FB] Found ${allClickable.length} clickable elements`);
        
        for (const el of allClickable) {
          const textContent = await el.evaluate(e => e.textContent?.trim().toLowerCase() || '');
          const ariaLabel = await el.evaluate(e => e.getAttribute('aria-label')?.toLowerCase() || '');
          
          if ((textContent === 'like' || textContent === 'أعجبني' || textContent === 'إعجاب') ||
              (ariaLabel.includes('like') || ariaLabel.includes('أعجبني'))) {
            likeButton = el;
            console.log(`[FB] Found like button: text="${textContent}" aria="${ariaLabel}"`);
            break;
          }
        }
      }

      if (!likeButton) {
        const url = this.page.url();
        console.log(`[FB] Current URL: ${url}`);
        console.log(`[FB] Like button not found`);
        return { success: false, error: "Like button not found - Facebook UI may have changed" };
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

      // Refresh the page to get clean state
      await this.page.goto(postUrl, { 
        waitUntil: "networkidle2",
        timeout: 60000 
      });
      await this.delay(5000);

      // Scroll down to load comments section
      await this.page.evaluate(() => {
        window.scrollBy(0, 600);
      });
      await this.delay(2000);

      // Extended list of comment box selectors for different Facebook versions
      const commentBoxSelectors = [
        'div[aria-label="Write a comment"]',
        'div[aria-label="Write a comment..."]',
        'div[aria-label="اكتب تعليقاً"]',
        'div[aria-label="اكتب تعليقاً..."]',
        'div[aria-label="أضف تعليقًا"]',
        'div[aria-label*="comment"]',
        'div[aria-label*="تعليق"]',
        'div[contenteditable="true"][role="textbox"]',
        'textarea[name="comment_text"]',
        '[data-testid="UFI2CommentTextarea/root"]',
        'div[data-sigil="comment-input"]',
        'form[data-sigil="commenting-form"] textarea',
      ];

      let commentBox = null;
      for (const selector of commentBoxSelectors) {
        try {
          commentBox = await this.page.$(selector);
          if (commentBox) {
            console.log(`[FB] Found comment box with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Try to find by looking for placeholder text
      if (!commentBox) {
        console.log(`[FB] Searching for comment input by text...`);
        const allInputs = await this.page.$$('div[contenteditable="true"], textarea, input[type="text"]');
        for (const input of allInputs) {
          try {
            const placeholder = await input.evaluate(e => 
              e.getAttribute('placeholder') || 
              e.getAttribute('aria-label') || 
              e.getAttribute('aria-placeholder') || 
              ''
            );
            if (placeholder.toLowerCase().includes('comment') || 
                placeholder.includes('تعليق') ||
                placeholder.includes('اكتب')) {
              commentBox = input;
              console.log(`[FB] Found comment input with placeholder: ${placeholder}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      // Try clicking on "Write a comment" section first
      if (!commentBox) {
        console.log(`[FB] Trying to click on comment section...`);
        const commentSections = await this.page.$$('[role="button"]');
        for (const section of commentSections) {
          try {
            const text = await section.evaluate(e => e.textContent || '');
            if (text.includes('Write a comment') || text.includes('تعليق') || text.includes('اكتب')) {
              await section.click();
              await this.delay(1000);
              // Now try to find the input again
              commentBox = await this.page.$('div[contenteditable="true"][role="textbox"]');
              if (commentBox) {
                console.log(`[FB] Found comment box after clicking section`);
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
      }

      if (!commentBox) {
        console.log(`[FB] Comment box not found after all attempts`);
        // Log current page elements for debugging
        const allAriaElements = await this.page.$$('[aria-label]');
        console.log(`[FB] Found ${allAriaElements.length} aria-label elements`);
        for (const el of allAriaElements.slice(0, 10)) {
          const label = await el.evaluate(e => e.getAttribute('aria-label'));
          console.log(`[FB] aria-label: "${label}"`);
        }
        return { success: false, error: "Comment box not found" };
      }

      await commentBox.click();
      await this.delay(500);

      await this.page.keyboard.type(commentText, { delay: 80 });
      await this.delay(1500);

      // Try multiple ways to submit
      await this.page.keyboard.press("Enter");
      await this.delay(3000);

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
