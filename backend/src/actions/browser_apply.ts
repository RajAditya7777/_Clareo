import { chromium } from "playwright";
import fs from "fs";

/**
 * Browser Apply Agent (The Closer)
 * Purpose: Automates form filling and document upload for job applications.
 * Targeting: Greenhouse, Lever, and generic forms.
 */

async function run() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  args.forEach(arg => {
    const [key, val] = arg.replace("--", "").split("=");
    params[key] = val;
  });

  const { url, resumePath, coverLetter, fullName, email } = params;

  if (!url || !resumePath) {
    console.error("Missing required params: --url, --resumePath");
    process.exit(1);
  }

  console.log(`[BrowserAgent] Starting application for ${url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    // 1. Identify Platform
    const isGreenhouse = page.url().includes("greenhouse.io");
    const isLever = page.url().includes("lever.co");

    console.log(`[BrowserAgent] Detected platform: ${isGreenhouse ? "Greenhouse" : isLever ? "Lever" : "Generic"}`);

    // 2. Fill Personal Details
    if (isGreenhouse) {
      await page.fill('input[name="job_application[first_name]"]', fullName?.split(" ")[0] || "");
      await page.fill('input[name="job_application[last_name]"]', fullName?.split(" ").slice(1).join(" ") || "");
      await page.fill('input[name="job_application[email]"]', email || "");
      
      // Upload Resume
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) await fileInput.setInputFiles(resumePath);
      
      // Cover Letter
      const clInput = await page.$('textarea[name="job_application[cover_letter]"], #cover_letter_text');
      if (clInput) await clInput.fill(coverLetter || "");

    } else if (isLever) {
      await page.fill('input[name="name"]', fullName || "");
      await page.fill('input[name="email"]', email || "");
      
      // Upload Resume
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) await fileInput.setInputFiles(resumePath);
      
      // Cover Letter
      const clInput = await page.$('textarea[name="comments"]');
      if (clInput) await clInput.fill(coverLetter || "");
    } else {
      // Generic fallback
      await page.fill('input[type="text"]:visible', fullName || "");
      await page.fill('input[type="email"]:visible', email || "");
    }

    // 3. Final Submission
    console.log("[BrowserAgent] Fields filled. Submitting application...");
    
    // In actual production, we check if user wants "Full Auto" or "Stop before submit"
    // User confirmed: "submit automatically"
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      '#submit-application',
      '#apply_button'
    ];
    
    // Find the first visible submit button
    for (const selector of submitSelectors) {
      const btn = await page.$(selector);
      if (btn && await btn.isVisible()) {
        await btn.click();
        break;
      }
    }

    await page.waitForTimeout(3000); // Wait for submission redirect
    console.log(`[BrowserAgent] Success: Application submitted for ${url}`);

  } catch (err) {
    console.error(`[BrowserAgent] Error: ${err}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
