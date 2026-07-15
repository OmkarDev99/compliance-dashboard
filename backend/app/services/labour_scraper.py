import asyncio
import json
import os
import re
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

LABOUR_CODES_DETAIL_URL = "https://www.labour.gov.in/offerings/schemes-and-services/details/labour-codes-gzNzQzMtQWa"

def clean_title(title_text):
    # Strip utility labels and sizes
    cleaned = title_text.replace("visibilityView", "").replace("visibilityदेखें", "")
    cleaned = cleaned.replace("visibility", "").replace("View", "").replace("देखें", "")
    # Remove file sizes e.g. "518.84 KB", "1.60 MB", "444.12 केबी", "1.29 एमबी"
    cleaned = re.sub(r'\d+(\.\d+)?\s*(KB|MB|KB|केबी|एमबी|GB|जीबी)', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    return cleaned

async def scrape_labour_codes(page):
    print("Scraping Labour Codes from Ministry of Labour & Employment...")
    documents = []
    
    try:
        await page.goto(LABOUR_CODES_DETAIL_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(5000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        links = soup.find_all("a", href=True)
        print(f"Found {len(links)} total links on page.")
        
        seen_urls = set()
        
        for l in links:
            href = l["href"]
            text = l.get_text(strip=True)
            
            # Check if it is a document link
            if not href.lower().endswith(".pdf"):
                continue
                
            if href in seen_urls:
                continue
            seen_urls.add(href)
            
            # Traverse parents to find description
            title = ""
            parent = l.parent
            
            # Check 1: Sibling search
            siblings = list(parent.previous_siblings) + list(parent.next_siblings)
            for sib in siblings:
                sib_text = sib.get_text(strip=True) if hasattr(sib, "get_text") else ""
                sib_text = clean_title(sib_text)
                if len(sib_text) > 10:
                    title = sib_text
                    break
            
            # Check 2: Walk up ancestor tree if sibling search failed
            if not title:
                curr = parent
                for _ in range(3):
                    if not curr:
                        break
                    # Find all divs/ps containing text within ancestor
                    child_texts = curr.find_all(["p", "div", "span", "td"])
                    for ct in child_texts:
                        ct_text = clean_title(ct.get_text(strip=True))
                        if len(ct_text) > 10 and not any(x in ct_text.lower() for x in ["visibility", "accept", "cookie", "skip to"]):
                            title = ct_text
                            break
                    if title:
                        break
                    curr = curr.parent
                    
            if not title:
                title = clean_title(text)
                
            if not title or len(title) < 5:
                title = "Ministry of Labour Document"
                
            # Classify category
            category = "Notification"
            keywords = ["labour ministry", "government of india", "compliance"]
            
            lower_title = title.lower()
            if "rule" in lower_title or "नियम" in lower_title:
                category = "Rule"
                keywords.extend(["central rules", "labour codes rules", "regulatory rules"])
            elif "faq" in lower_title:
                category = "FAQ"
                keywords.extend(["faq", "frequently asked questions", "q&a"])
            elif "booklet" in lower_title or "handbook" in lower_title:
                category = "Guideline"
                keywords.extend(["handbook", "guideline booklet", "employers guide"])
            elif "code" in lower_title or "संहिता" in lower_title:
                category = "Labour Code"
                keywords.extend(["labour code", "consolidated act", "reform codes"])
            elif "notification" in lower_title or "अधिसूचना" in lower_title:
                category = "Notification"
                keywords.extend(["gazette notification", "official announcement"])
            else:
                category = "Act / Policy"
                keywords.extend(["acts", "labour laws", "policies"])
                
            # Parse publication year
            year = "2020"
            for y in ["2026", "2025", "2021", "2019", "2020"]:
                if y in lower_title or y in href:
                    year = y
                    break
                    
            doc = {
                "title": title,
                "source": "Ministry of Labour & Employment",
                "category": category,
                "publication_date": f"01-01-{year}",
                "url": href,
                "full_text": f"Ministry of Labour & Employment Document: '{title}'. Classification: {category}. Resource Link: {href}.",
                "document_type": "PDF",
                "last_updated": datetime.utcnow().isoformat() + "Z",
                "keywords": list(set(keywords))
            }
            documents.append(doc)
    except Exception as e:
        print(f"Error scraping labour codes page: {e}")
        
    print(f"Total Labour Laws documents compiled: {len(documents)}")
    return documents

async def main():
    print("Starting Ministry of Labour Web Scraper...")
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        await page.add_init_script("delete navigator.__proto__.webdriver;")
        
        # Scrape data
        scraped_docs = await scrape_labour_codes(page)
        
        # Save output to JSON file
        output_path = "labour_scraped_data.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(scraped_docs, f, indent=4, ensure_ascii=False)
            
        print(f"\nScraping successfully finished. Saved {len(scraped_docs)} documents to: {os.path.abspath(output_path)}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
