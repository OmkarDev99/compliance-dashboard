import asyncio
import json
import os
import re
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

HOME_URL = "https://udyamregistration.gov.in"
CIRCULAR_URL = "https://udyamregistration.gov.in/Circular.aspx"

async def scrape_udyam_circulars(page):
    print("Scraping Circulars & Orders from Udyam Registration Portal...")
    documents = []
    
    try:
        await page.goto(CIRCULAR_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(3000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        table = soup.find("table")
        if not table:
            print("No table element found on Circulars & Orders page.")
            return []
            
        rows = table.find_all("tr")
        print(f"Found {len(rows)} rows on Circulars & Orders page.")
        
        for idx, r in enumerate(rows[1:]):  # Skip header row
            cols = r.find_all("td")
            if len(cols) >= 2:
                sno = cols[0].get_text(strip=True)
                subject_cell = cols[1]
                subject_text = re.sub(r"\s+", " ", subject_cell.get_text(strip=True))
                
                # Extract date
                date_text = cols[2].get_text(strip=True) if len(cols) > 2 else ""
                
                # Locate links inside subject cell
                links = subject_cell.find_all("a", href=True)
                target_url = CIRCULAR_URL
                pdf_link = False
                
                if links:
                    href = links[0]["href"]
                    if href.startswith("/"):
                        target_url = HOME_URL + href
                    elif href.startswith("../"):
                        target_url = HOME_URL + href[2:]
                    elif not href.startswith("http"):
                        target_url = HOME_URL + "/" + href
                    else:
                        target_url = href
                        
                    if target_url.lower().endswith(".pdf"):
                        pdf_link = True
                
                # Classify category
                lower_subject = subject_text.lower()
                category = "Circular"
                if "notification" in lower_subject or "s.o." in lower_subject or "g.s.r" in lower_subject:
                    category = "Notification"
                elif "order" in lower_subject:
                    category = "Government Order"
                elif "bulletin" in lower_subject:
                    category = "Bulletin"
                elif "clarification" in lower_subject:
                    category = "Guideline"
                    
                keywords = ["udyam", "msme", "registration", "compliance", "government of india"]
                if "locker" in lower_subject:
                    keywords.append("digilocker")
                if "informal" in lower_subject:
                    keywords.append("informal enterprise")
                if "assist" in lower_subject:
                    keywords.append("udyam assist")
                if "definition" in lower_subject or "classification" in lower_subject:
                    keywords.append("msme definition")
                
                doc = {
                    "title": subject_text,
                    "source": "Udyam Portal",
                    "category": category,
                    "publication_date": date_text,
                    "url": target_url,
                    "full_text": f"Udyam Portal circular/order regarding: {subject_text}. Published date: {date_text}.",
                    "document_type": "PDF" if pdf_link else "Web Page",
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "keywords": keywords
                }
                documents.append(doc)
                
        print(f"Extracted {len(documents)} circulars and orders.")
        return documents
        
    except Exception as e:
        print(f"Error scraping Udyam Portal: {e}")
        return []

async def main():
    print("Starting Udyam Registration Web Scraper...")
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        
        circulars = await scrape_udyam_circulars(page)
        
        # Save output relative to backend/ root directory
        output_path = "udyam_scraped_data.json"
        
        # If run from inside app/services/, write in backend/
        if os.path.basename(os.getcwd()) == "services":
            output_path = "../../udyam_scraped_data.json"
        elif os.path.basename(os.getcwd()) == "app":
            output_path = "../udyam_scraped_data.json"
            
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(circulars, f, indent=4, ensure_ascii=False)
            
        print(f"Scraping successfully finished. Saved {len(circulars)} records to: {os.path.abspath(output_path)}")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
