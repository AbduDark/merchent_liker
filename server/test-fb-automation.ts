import { FacebookAutomation } from "./facebook-automation";

const POST_URL = "https://www.facebook.com/permalink.php?story_fbid=pfbid02R69rVQShg6TTKqRJFrzg14JgdiRD4aizEVtWNXes6TyiRTJEfoP99xn97ZyQLcEnl&id=100025072534492&rdid=VFaRaEEYpMJUy6Ct#";

interface AccountTest {
  name: string;
  email: string;
  password: string;
}

async function testFacebookAutomation() {
  console.log("=".repeat(60));
  console.log("Facebook Automation Test");
  console.log("=".repeat(60));

  const accounts: AccountTest[] = [
    {
      name: "Account 1",
      email: process.env.FB_ACCOUNT1_EMAIL || "",
      password: process.env.FB_ACCOUNT1_PASSWORD || "",
    },
    {
      name: "Account 2",
      email: process.env.FB_ACCOUNT2_EMAIL || "",
      password: process.env.FB_ACCOUNT2_PASSWORD || "",
    },
  ];

  for (const account of accounts) {
    console.log("\n" + "-".repeat(60));
    console.log(`Testing ${account.name}: ${account.email.substring(0, 5)}***`);
    console.log("-".repeat(60));

    if (!account.email || !account.password) {
      console.log(`[ERROR] Missing credentials for ${account.name}`);
      continue;
    }

    const automation = new FacebookAutomation();

    try {
      console.log("[1] Initializing browser...");
      await automation.initialize();
      console.log("[OK] Browser initialized");

      console.log("[2] Attempting login...");
      const loginSuccess = await automation.login({
        username: account.email,
        password: account.password,
      });

      if (!loginSuccess) {
        console.log(`[FAIL] Login failed for ${account.name}`);
        await automation.close();
        continue;
      }
      console.log("[OK] Login successful");

      console.log("[3] Attempting to like post...");
      const likeResult = await automation.likePost(POST_URL);
      
      if (likeResult.success) {
        console.log("[OK] Post liked successfully");
      } else {
        console.log(`[FAIL] Like failed: ${likeResult.error}`);
      }

      console.log("[4] Closing browser...");
      await automation.close();
      console.log("[OK] Browser closed");

      console.log(`\n[RESULT] ${account.name}: ${likeResult.success ? "SUCCESS" : "FAILED"}`);

    } catch (error) {
      console.error(`[ERROR] ${account.name} test failed:`, error);
      await automation.close();
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test completed");
  console.log("=".repeat(60));
}

testFacebookAutomation().catch(console.error);
