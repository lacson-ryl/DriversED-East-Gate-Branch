// utils-backend/generateCertificatePDF.js
import puppeteer from "puppeteer";
import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // Correct import for ES modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateCertificatePDF({ type, payload }) {
  try {
    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/google-chrome-stable",
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
        "--enable-logging=stderr", // Add this line
        "--disable-gpu", // Add this to prevent GPU issues in headless environments
        "--disable-dev-shm-usage", // Add to avoid issues in constrained Docker envs
      ],
    });

    const page = await browser.newPage();

    const templatePath = path.join(
      __dirname,
      "../views",
      `certificate-of-completion-${type}.ejs`
    );

    const tailwindCSS = fs.readFileSync(
      path.join(__dirname, "../shared/f-css", "output.css"),
      "utf-8"
    );

    const html = await ejs.renderFile(templatePath, {
      payload,
      isPDF: true,
      tailwindCSS,
    });

    // 3. Use page.setContent to directly load the HTML
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // 4. Wait for your module script logic to execute
    try {
      await page.waitForFunction(() => window.scriptLoaded === true, {
        timeout: 30000,
      });
    } catch (err) {
      const html = await page.content();
      console.error("PDF waitForFunction timed out. Page content:\n", html);
      throw err;
    }

    // 5. Evaluate the page to remove print-specific elements
    await page.evaluate(() => {
      document.querySelectorAll(".hide-on-print").forEach((el) => el.remove());
    });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error("Failed to generate pdf", error);
    throw error;
  }
}
