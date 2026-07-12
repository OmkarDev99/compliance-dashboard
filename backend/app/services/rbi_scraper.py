import asyncio
import json
import os
import re
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

HOME_URL = "https://www.rbi.org.in"
MAS_DIRECTIONS_URL = "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx"
NOTIFICATIONS_URL = "https://www.rbi.org.in/Scripts/NotificationUser.aspx"
FAQS_URL = "https://rbi.org.in/Scripts/FAQView.aspx"
PRESS_RELEASES_URL = "https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx"

async def scrape_master_directions(page):
    print("Scraping Master Directions from RBI...")
    try:
        await page.goto(MAS_DIRECTIONS_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(4000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        # Master directions is usually the first/only major table
        table = soup.find("table")
        if not table:
            print("No table found on Master Directions page.")
            return []
            
        rows = table.find_all("tr")
        print(f"Found {len(rows)} rows on Master Directions page.")
        
        documents = []
        current_category = "General Banking"
        current_date = datetime.today().strftime('%b %d, %Y')
        
        # Regex to match RBI date format (e.g. 'Jul 03, 2018')
        date_pattern = re.compile(r'^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$')
        
        for r in rows:
            cells = r.find_all(["td", "th"])
            if not cells:
                continue
                
            cells_text = [c.get_text(strip=True) for c in cells]
            if len(cells_text) == 1:
                text = cells_text[0]
                if date_pattern.match(text):
                    current_date = text
                else:
                    current_category = text
            elif len(cells_text) >= 2:
                title = cells_text[0]
                links = r.find_all("a", href=True)
                
                html_link = MAS_DIRECTIONS_URL
                pdf_link = ""
                
                for l in links:
                    href = l["href"]
                    if href.startswith("/"):
                        href = HOME_URL + href
                    elif not href.startswith("http"):
                        href = HOME_URL + "/Scripts/" + href
                        
                    if href.lower().endswith(".pdf"):
                        pdf_link = href
                    else:
                        html_link = href
                        
                target_url = pdf_link if pdf_link else html_link
                
                doc = {
                    "title": f"Master Direction - {title}",
                    "source": "RBI Portal",
                    "category": "Master Direction",
                    "publication_date": current_date,
                    "url": target_url,
                    "full_text": f"RBI Master Direction regarding: {title}. Section: {current_category}. Published/Updated: {current_date}.",
                    "document_type": "PDF" if pdf_link else "HTML",
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "keywords": ["rbi", "master direction", current_category.lower(), "compliance"]
                }
                documents.append(doc)
                
                # Limit to first 20 entries
                if len(documents) >= 20:
                    break
                    
        print(f"Extracted {len(documents)} Master Directions.")
        return documents
    except Exception as e:
        print(f"Error scraping Master Directions: {e}")
        return []

async def scrape_notifications(page):
    print("Scraping Notifications and Circulars from RBI...")
    try:
        await page.goto(NOTIFICATIONS_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(4000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        tables = soup.find_all("table")
        if len(tables) < 2:
            print("Could not find notifications list table.")
            return []
            
        table = tables[1] # Usually second table contains notifications
        rows = table.find_all("tr")
        print(f"Found {len(rows)} rows on Notifications page.")
        
        documents = []
        current_date = datetime.today().strftime('%b %d, %Y')
        date_pattern = re.compile(r'^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$')
        
        for r in rows:
            cells = r.find_all(["td", "th"])
            if not cells:
                continue
                
            cells_text = [c.get_text(strip=True) for c in cells]
            if len(cells_text) == 1:
                text = cells_text[0]
                if date_pattern.match(text):
                    current_date = text
            elif len(cells_text) >= 2:
                title = cells_text[0]
                links = r.find_all("a", href=True)
                
                html_link = NOTIFICATIONS_URL
                pdf_link = ""
                
                for l in links:
                    href = l["href"]
                    if href.startswith("/"):
                        href = HOME_URL + href
                    elif not href.startswith("http"):
                        href = HOME_URL + "/Scripts/" + href
                        
                    if href.lower().endswith(".pdf"):
                        pdf_link = href
                    else:
                        html_link = href
                        
                target_url = pdf_link if pdf_link else html_link
                
                # Tag as circular/guideline based on content
                cat = "Notification"
                if "circular" in title.lower():
                    cat = "Circular"
                elif "guideline" in title.lower() or "instruction" in title.lower():
                    cat = "Guideline"
                    
                doc = {
                    "title": f"RBI {cat} - {title}",
                    "source": "RBI Portal",
                    "category": cat,
                    "publication_date": current_date,
                    "url": target_url,
                    "full_text": f"Reserve Bank of India official {cat.lower()} on: {title}. Date: {current_date}.",
                    "document_type": "PDF" if pdf_link else "HTML",
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "keywords": ["rbi", cat.lower(), "banking regulation"]
                }
                documents.append(doc)
                
                # Limit to top 20
                if len(documents) >= 20:
                    break
                    
        print(f"Extracted {len(documents)} Notifications/Circulars/Guidelines.")
        return documents
    except Exception as e:
        print(f"Error scraping Notifications: {e}")
        return []

async def scrape_press_releases(page):
    print("Scraping Press Releases from RBI...")
    try:
        await page.goto(PRESS_RELEASES_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(4000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        table = soup.find("table", class_="tablebg")
        if not table:
            print("No tablebg found on Press Releases page.")
            return []
            
        rows = table.find_all("tr")
        print(f"Found {len(rows)} rows on Press Releases page.")
        
        documents = []
        current_date = datetime.today().strftime('%b %d, %Y')
        date_pattern = re.compile(r'^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$')
        
        for r in rows:
            cells = r.find_all(["td", "th"])
            if not cells:
                continue
                
            cells_text = [c.get_text(strip=True) for c in cells]
            if len(cells_text) == 1:
                text = cells_text[0]
                if date_pattern.match(text):
                    current_date = text
            elif len(cells_text) >= 2:
                title = cells_text[0]
                links = r.find_all("a", href=True)
                
                html_link = PRESS_RELEASES_URL
                pdf_link = ""
                
                for l in links:
                    href = l["href"]
                    if href.startswith("/"):
                        href = HOME_URL + href
                    elif not href.startswith("http"):
                        href = HOME_URL + "/scripts/" + href
                        
                    if href.lower().endswith(".pdf"):
                        pdf_link = href
                    else:
                        html_link = href
                        
                target_url = pdf_link if pdf_link else html_link
                
                doc = {
                    "title": f"RBI Press Release - {title}",
                    "source": "RBI Portal",
                    "category": "Press Release",
                    "publication_date": current_date,
                    "url": target_url,
                    "full_text": f"RBI Press Release: {title}. Date: {current_date}.",
                    "document_type": "PDF" if pdf_link else "HTML",
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "keywords": ["rbi", "press release", "regulatory announcement"]
                }
                documents.append(doc)
                
                # Limit to top 20
                if len(documents) >= 20:
                    break
                    
        print(f"Extracted {len(documents)} Press Releases.")
        return documents
    except Exception as e:
        print(f"Error scraping Press Releases: {e}")
        return []

async def scrape_faqs(page):
    print("Scraping FAQs from RBI...")
    try:
        await page.goto(FAQS_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(4000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        tables = soup.find_all("table")
        if len(tables) < 2:
            print("No FAQs list table found.")
            return []
            
        table = tables[1]
        rows = table.find_all("tr")
        
        faq_items = []
        current_category = "General"
        
        # Regex to parse date joined with title, e.g. "Nov 12, 2021Retail Direct Scheme"
        faq_item_pattern = re.compile(r'^([A-Za-z]{3}\s+\d{1,2},\s+\d{4})(.*)$')
        
        for r in rows:
            cells = r.find_all(["td", "th"])
            if not cells:
                continue
                
            cells_text = [c.get_text(strip=True) for c in cells]
            links = r.find_all("a", href=True)
            
            if not links:
                if cells_text:
                    current_category = cells_text[0]
            else:
                raw_text = cells_text[0] if cells_text else links[0].get_text(strip=True)
                href = links[0]["href"]
                
                if href.startswith("/"):
                    detail_url = HOME_URL + href
                elif not href.startswith("http"):
                    detail_url = HOME_URL + "/Scripts/" + href
                else:
                    detail_url = href
                    
                match = faq_item_pattern.match(raw_text)
                if match:
                    pub_date = match.group(1)
                    title = match.group(2)
                else:
                    pub_date = datetime.today().strftime('%b %d, %Y')
                    title = raw_text
                    
                faq_items.append({
                    "title": title,
                    "url": detail_url,
                    "date": pub_date,
                    "category": current_category
                })
                
                # Limit to 15 FAQ categories/items to prevent excessive HTTP requests
                if len(faq_items) >= 15:
                    break
                    
        print(f"Found {len(faq_items)} FAQ detail links to scrape.")
        
        scraped_faqs = []
        for item in faq_items:
            print(f"Scraping detail FAQ: {item['title']}...")
            try:
                await page.goto(item["url"], wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)
                
                detail_html = await page.content()
                detail_soup = BeautifulSoup(detail_html, "html.parser")
                
                container = detail_soup.find(id="FAQDiv") or detail_soup.find(class_="FAQDiv") or detail_soup.find("table")
                if container:
                    full_text = container.get_text(separator="\n", strip=True)
                else:
                    full_text = detail_soup.body.get_text(separator="\n", strip=True)
                    
                doc = {
                    "title": f"FAQ - {item['title']}",
                    "source": "RBI Portal",
                    "category": "FAQ",
                    "publication_date": item["date"],
                    "url": item["url"],
                    "full_text": full_text[:4000], # Cap text size
                    "document_type": "HTML",
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "keywords": ["rbi", "faq", item["category"].lower(), "compliance"]
                }
                scraped_faqs.append(doc)
            except Exception as detail_err:
                print(f"Error scraping FAQ detail {item['url']}: {detail_err}")
                
        return scraped_faqs
    except Exception as e:
        print(f"Error scraping FAQs: {e}")
        return []

async def main():
    print("Starting Reserve Bank of India (RBI) Web Scraper...")
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        await page.add_init_script("delete navigator.__proto__.webdriver;")
        
        # Scrape all modules
        directions = await scrape_master_directions(page)
        notifications = await scrape_notifications(page)
        releases = await scrape_press_releases(page)
        faqs = await scrape_faqs(page)
        
        all_documents = directions + notifications + releases + faqs
        
        # Output results to JSON file
        output_path = "rbi_scraped_data.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_documents, f, indent=4, ensure_ascii=False)
            
        print(f"\nScraping successfully finished. Saved {len(all_documents)} documents to: {os.path.abspath(output_path)}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
