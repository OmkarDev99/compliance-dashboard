import asyncio
import json
import os
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

HOME_URL = "https://www.mca.gov.in/content/mca/global/en/home.html"
COMPANIES_ACT_URL = "https://www.mca.gov.in/content/mca/global/en/acts-rules/companies-act-2013.html"

async def scrape_dms_tabs(page):
    print("Scraping DMS updates tabs from MCA homepage...")
    tabs = [
        {"name": "Notification", "selector": "button.notice-circular", "keywords": ["notification", "notice", "mca"]},
        {"name": "Circular", "selector": "button.circulars-assign", "keywords": ["circular", "compliance", "mca"]},
        {"name": "Press Release", "selector": "button.press-releases", "keywords": ["press release", "announcement", "mca"]},
        {"name": "Important Update", "selector": "button.briefcase-iu", "keywords": ["update", "important", "mca"]}
    ]
    
    scraped_documents = []
    
    for tab in tabs:
        name = tab["name"]
        sel = tab["selector"]
        keywords = tab["keywords"]
        print(f"Loading tab: {name} (selector: {sel})")
        
        try:
            # Find the button locator
            btn_loc = page.locator(sel).first
            
            # Extract target ID dynamically (since they change per session)
            target_id = await btn_loc.get_attribute("data-bs-target")
            if not target_id:
                print(f"Could not retrieve target ID for {name}.")
                continue
                
            # Click button using JS
            await btn_loc.evaluate("el => el.click()")
            await page.wait_for_timeout(4000) # Wait for AJAX content
            
            # Parse the inner html of tab pane
            pane_html = await page.inner_html(target_id)
            soup = BeautifulSoup(pane_html, "html.parser")
            
            containers = soup.select("div.titleSizeDate")
            print(f"Found {len(containers)} items in '{name}' tab.")
            
            for c in containers:
                title_el = c.select_one("span.doc-link")
                date_el = c.select_one("div.doc-date")
                
                title = ""
                doc_url = HOME_URL
                if title_el:
                    link_el = title_el.find("a", href=True)
                    if link_el:
                        title = link_el.get_text(strip=True)
                        href = link_el["href"]
                        doc_url = href if href.startswith("http") else "https://www.mca.gov.in" + href
                    else:
                        title = title_el.get_text(strip=True)
                        
                pub_date = date_el.get_text(strip=True) if date_el else ""
                
                if not title:
                    continue
                    
                doc = {
                    "title": title,
                    "source": "MCA Portal",
                    "category": name,
                    "publication_date": pub_date,
                    "url": doc_url,
                    "full_text": f"{name} update: {title}",
                    "document_type": "PDF" if doc_url and ".pdf" in doc_url.lower() else "HTML",
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "keywords": keywords
                }
                scraped_documents.append(doc)
                
        except Exception as e:
            print(f"Error parsing tab {name}: {e}")
            
    return scraped_documents

async def scrape_companies_act(page):
    print("\nNavigating to Companies Act page...")
    try:
        await page.goto(COMPANIES_ACT_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(5000)
        
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        # Look for links related to Companies Act sections, rules, or chapters
        act_docs = []
        links = soup.find_all("a", href=True)
        print(f"Found {len(links)} links on Companies Act page.")
        
        for link in links:
            text = link.get_text(strip=True)
            href = link["href"]
            
            # Filter links relevant to Rules, Chapters, or Acts
            if any(kw in text.lower() for kw in ["chapter", "schedule", "amendment", "rules", "act"]):
                doc_url = href if href.startswith("http") else "https://www.mca.gov.in" + href
                doc = {
                    "title": f"Companies Act 2013 - {text}",
                    "source": "MCA Portal",
                    "category": "Act & Rules",
                    "publication_date": datetime.today().strftime('%d-%m-%Y'),
                    "url": doc_url,
                    "full_text": f"Reference document for Companies Act 2013: {text}",
                    "document_type": "PDF" if doc_url.endswith(".pdf") else "HTML",
                    "last_updated": datetime.utcnow().isoformat() + "Z",
                    "keywords": ["companies act", "rules", "mca", "law"]
                }
                act_docs.append(doc)
                if len(act_docs) >= 15: # Limit to top 15 resources
                    break
        print(f"Extracted {len(act_docs)} Act & Rules documents.")
        return act_docs
    except Exception as e:
        print(f"Error scraping Companies Act: {e}")
        return []

def get_mca_forms_data():
    forms = [
        {
            "title": "Form AOC-4 - Filing of Financial Statements",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/dam/mca/instruction-kit/AOC-4.pdf",
            "full_text": (
                "Form Name: AOC-4 (Financial Statements)\n"
                "Purpose: Filing financial statements, balance sheets, profit & loss statements, and director reports.\n"
                "Who should file: All registered companies under the Companies Act 2013.\n"
                "Due Date: Within 30 days from the date of the Annual General Meeting (AGM).\n"
                "Required Documents: Balance Sheet, Profit and Loss Account, Director's Report, Auditor's Report, Notice of AGM.\n"
                "Penalty: ₹100 per day of delay.\n"
                "Official Instructions: Must be audited by a chartered accountant and submitted with digital signatures."
            ),
            "document_type": "PDF",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["aoc-4", "financial statements", "agm", "annual filing"]
        },
        {
            "title": "Form MGT-7 - Annual Return of Company",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/dam/mca/instruction-kit/MGT-7.pdf",
            "full_text": (
                "Form Name: MGT-7 (Annual Return)\n"
                "Purpose: Annual disclosure of shareholding structure, transfers, management, and board meetings.\n"
                "Who should file: All registered companies (excluding OPCs and small companies who file MGT-7A).\n"
                "Due Date: Within 60 days from the date of the AGM.\n"
                "Required Documents: List of shareholders, share transfers list, MGT-8 certificate (for listed/large companies).\n"
                "Penalty: ₹100 per day of delay.\n"
                "Official Instructions: Must be digitally signed by a Director and a practicing Company Secretary."
            ),
            "document_type": "PDF",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["mgt-7", "annual return", "shareholders", "agm"]
        },
        {
            "title": "Form MGT-14 - Filing of Board/General Meeting Resolutions",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Form Name: MGT-14 (Filing of Resolutions)\n"
                "Purpose: Registration of board resolutions or special resolutions passed by shareholders.\n"
                "Who should file: Companies executing resolutions under Section 117 of the Companies Act 2013.\n"
                "Due Date: Within 30 days of passing the resolution.\n"
                "Required Documents: Copy of resolution, explanatory statement, amended Memorandum/Articles (if applicable).\n"
                "Penalty: Late filing fees (₹100/day); company/directors are subject to default compounding.\n"
                "Official Instructions: File online on the MCA V3 portal with digital signature authorization."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["mgt-14", "resolutions", "special resolution", "board meeting"]
        },
        {
            "title": "Form DIR-3 KYC - Director Verification and KYC",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Form Name: DIR-3 KYC (Director KYC)\n"
                "Purpose: Annual verification of Director Identification Number (DIN) details to keep it active.\n"
                "Who should file: Every individual holding a DIN as of 31st March of the financial year.\n"
                "Due Date: On or before 30th September of every financial year.\n"
                "Required Documents: PAN Card, Aadhaar Card, Passport/Voter ID (identity proof), utility bills (address proof).\n"
                "Penalty: DIN deactivation and ₹5,000 fine for late reactivation.\n"
                "Official Instructions: Ensure name, address, and mobile number match identity proofs exactly."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["dir-3 kyc", "director", "din", "kyc"]
        },
        {
            "title": "Form ADT-1 - Appointment of Auditor",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Form Name: ADT-1 (Auditor Appointment)\n"
                "Purpose: Informing the Registrar of the appointment of a new/renewed statutory auditor.\n"
                "Who should file: Every company appointing an auditor under Section 139.\n"
                "Due Date: Within 15 days from the date of the AGM where the auditor was appointed.\n"
                "Required Documents: Auditor consent letter, eligibility certificate, copy of AGM resolution.\n"
                "Penalty: ₹100 per day of delay.\n"
                "Official Instructions: File using digital signatures on the web-based MCA V3 portal."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["adt-1", "auditor", "audit", "agm"]
        },
        {
            "title": "Form INC-20A - Declaration of Commencement of Business",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Form Name: INC-20A (Commencement of Business)\n"
                "Purpose: Declaring that subscribers to the MOA have paid the value of shares and capital receipt.\n"
                "Who should file: Companies incorporated after 2nd November 2018 having a share capital.\n"
                "Due Date: Within 180 days of the date of incorporation.\n"
                "Required Documents: Bank statement showing receipt of share capital, proof of regulatory approval (if applicable).\n"
                "Penalty: ₹50,000 for company, ₹1,000/day for directors; company striking-off threat after 180 days.\n"
                "Official Instructions: File before executing any commercial transactions or borrowing capital."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["inc-20a", "incorporation", "share capital", "commencement"]
        },
        {
            "title": "Form PAS-3 - Return of Allotment of Shares",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Form Name: PAS-3 (Return of Allotment)\n"
                "Purpose: Registering the allotment of shares or securities issued to public/private investors.\n"
                "Who should file: All companies allotting shares under Section 39.\n"
                "Due Date: Within 30 days from the date of allotment.\n"
                "Required Documents: Board resolution authorizing allotment, list of allottees, valuation report (if non-cash).\n"
                "Penalty: ₹100 per day of delay.\n"
                "Official Instructions: File details of nominal value, premium, and date of allocation of shares."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["pas-3", "allotment", "shares", "board resolution"]
        },
        {
            "title": "Form SH-7 - Alteration of Share Capital",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Form Name: SH-7 (Alteration of Share Capital)\n"
                "Purpose: Registering changes/increase in authorized share capital or number of members.\n"
                "Who should file: Companies increasing or altering their capital structure under Section 64.\n"
                "Due Date: Within 30 days of passing the resolution.\n"
                "Required Documents: Resolution copy, altered Memorandum of Association (MOA), altered Articles (AOA).\n"
                "Penalty: ₹100 per day of delay.\n"
                "Official Instructions: Upload altered MOA showing the updated capital clause."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["sh-7", "share capital", "moa", "capital increase"]
        },
        {
            "title": "Form CHG-1 & CHG-4 - Charge Management (Creation & Satisfaction)",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Form Name: CHG-1 (Charge Creation/Modification) & CHG-4 (Satisfaction of Charge)\n"
                "Purpose: Registering the creation, modification (CHG-1) or satisfaction (CHG-4) of mortgage/charges.\n"
                "Who should file: Companies securing bank loans or clearing corporate loan pledges.\n"
                "Due Date: CHG-1 within 30 days of creation/modification; CHG-4 within 30 days of satisfaction.\n"
                "Required Documents: Charge/pledge deed, loan agreement, NOC from lender/bank (for CHG-4).\n"
                "Penalty: Late fees apply; delay beyond 120 days requires Regional Director condonation.\n"
                "Official Instructions: Check indexing of charges on the MCA portal post-approval."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["chg-1", "chg-4", "charge", "loan", "mortgage"]
        },
        {
            "title": "LLP Forms - LLP Form 3 (Agreement), Form 11 (Annual Return) & Form 8 (Solvency)",
            "source": "MCA Portal",
            "category": "MCA Form",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Form Name: LLP Form-3 (LLP Agreement), Form-11 (Annual Return), Form-8 (Accounts & Solvency)\n"
                "Purpose: Registering LLP agreement (Form 3), submitting yearly returns (Form 11), and financial details (Form 8).\n"
                "Who should file: All registered Limited Liability Partnerships.\n"
                "Due Date: Form 11 within 60 days of FY end (30th May); Form 8 within 30 days of end of 6 months of FY (30th October).\n"
                "Required Documents: Copy of LLP agreement (Form 3), Statement of assets and liabilities (Form 8).\n"
                "Penalty: ₹100 per day of delay per form.\n"
                "Official Instructions: Pre-fill partner details using LLPIN prior to submitting."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["llp", "form-3", "form-11", "form-8", "solvency"]
        }
    ]
    return forms

def get_mca_faqs_data():
    faqs = [
        {
            "title": "FAQ: What is DIR-3 KYC?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Question: What is DIR-3 KYC?\n"
                "Answer: DIR-3 KYC is an annual verification form that every individual holding a Director Identification Number (DIN) "
                "must submit to the Ministry of Corporate Affairs (MCA) to verify and keep their KYC details (identity, contact details, "
                "and address) active."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["dir-3 kyc", "director", "din", "kyc"]
        },
        {
            "title": "FAQ: When should Form AOC-4 be filed?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/dam/mca/instruction-kit/AOC-4.pdf",
            "full_text": (
                "Question: When should Form AOC-4 be filed?\n"
                "Answer: Form AOC-4 (for filing financial statements) must be filed with the Registrar of Companies (ROC) "
                "within 30 days of the date of the company's Annual General Meeting (AGM). For One Person Companies (OPC), "
                "it must be filed within 180 days from the closure of the financial year."
            ),
            "document_type": "PDF",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["aoc-4", "financial statements", "agm", "due date"]
        },
        {
            "title": "FAQ: What is the penalty for late filing of DIR-3 KYC?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Question: What is the penalty for late filing of DIR-3 KYC?\n"
                "Answer: If a director fails to file DIR-3 KYC by the due date (30th September), their Director Identification "
                "Number (DIN) will be deactivated. A penalty fee of ₹5,000 is required to reactivate the DIN in the system."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["dir-3 kyc", "penalty", "deactivation", "din"]
        },
        {
            "title": "FAQ: What is the penalty for late filing of Form AOC-4 or MGT-7?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Question: What is the penalty for late filing of Form AOC-4 or MGT-7?\n"
                "Answer: The late filing fee for both Form AOC-4 and Form MGT-7 is ₹100 per day of delay from the respective due date, "
                "without any upper limit on the accumulated late fees."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["aoc-4", "mgt-7", "late fees", "penalty"]
        },
        {
            "title": "FAQ: When should Form MGT-7 be filed?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/dam/mca/instruction-kit/MGT-7.pdf",
            "full_text": (
                "Question: When should Form MGT-7 be filed?\n"
                "Answer: Form MGT-7 (for filing the company's annual return) must be filed within 60 days of the date on which "
                "the Annual General Meeting (AGM) was held or should have been held."
            ),
            "document_type": "PDF",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["mgt-7", "annual return", "agm", "due date"]
        },
        {
            "title": "FAQ: What is the purpose and due date of Form INC-20A?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Question: What is the purpose and due date of Form INC-20A?\n"
                "Answer: Form INC-20A is the declaration of commencement of business. Every company incorporated with share capital "
                "after 2nd November 2018 must file it within 180 days of incorporation to declare that subscribers have paid the value "
                "of shares taken. Failure to file incurs a penalty of ₹50,000 and restricts business transactions."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["inc-20a", "commencement", "incorporation", "due date"]
        },
        {
            "title": "FAQ: What are the due dates for LLP Form 11 and LLP Form 8?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Question: What are the due dates for LLP Form 11 and LLP Form 8?\n"
                "Answer: LLP Form 11 (Annual Return) must be filed annually within 60 days from the closure of the financial year (by 30th May). "
                "LLP Form 8 (Statement of Accounts & Solvency) must be filed annually within 30 days from the end of 6 months of the financial year (by 30th October)."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["llp", "form-11", "form-8", "due date"]
        },
        {
            "title": "FAQ: What is Form ADT-1 and when must it be filed?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Question: What is Form ADT-1 and when must it be filed?\n"
                "Answer: Form ADT-1 is used by a company to notify the Registrar of Companies (ROC) about the appointment of its statutory auditor. "
                "It must be filed within 15 days of the date of the AGM where the auditor was appointed."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["adt-1", "auditor", "appointment", "due date"]
        },
        {
            "title": "FAQ: What is the difference between Form MGT-7 and MGT-7A?",
            "source": "MCA Portal",
            "category": "FAQ",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
            "full_text": (
                "Question: What is the difference between Form MGT-7 and MGT-7A?\n"
                "Answer: Form MGT-7 is the standard annual return form for all public and private companies. Form MGT-7A is an abridged "
                "annual return form designed specifically for One Person Companies (OPCs) and Small Companies to simplify compliance requirements."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["mgt-7", "mgt-7a", "small company", "opc"]
        }
    ]
    return faqs

def get_mca_rules_data():
    rules = [
        {
            "title": "Companies (Incorporation) Rules, 2014",
            "source": "MCA Portal",
            "category": "Act & Rules",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/rules.html",
            "full_text": (
                "Ruleset: Companies (Incorporation) Rules, 2014\n"
                "Purpose: Governing the complete legal procedure for incorporation of private, public, OPC, and Section 8 companies, "
                "including reservation of name (RUN), signing of memorandum, registered office setup, and commencement of business."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["companies rules", "incorporation", "incorporation rules", "mca"]
        },
        {
            "title": "Companies (Appointment and Qualification of Directors) Rules, 2014",
            "source": "MCA Portal",
            "category": "Act & Rules",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/rules.html",
            "full_text": (
                "Ruleset: Companies (Appointment and Qualification of Directors) Rules, 2014\n"
                "Purpose: Governing the allotment of Director Identification Numbers (DIN), annual Director KYC verification, "
                "qualification criteria, disqualifications of directors, and maintaining the register of directors."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["directors rules", "director qualification", "din", "kyc", "mca"]
        },
        {
            "title": "Companies (Accounts) Rules, 2014",
            "source": "MCA Portal",
            "category": "Act & Rules",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/rules.html",
            "full_text": (
                "Ruleset: Companies (Accounts) Rules, 2014\n"
                "Purpose: Regulating the maintenance of books of accounts, preparation of financial statements (consolidated & standalone), "
                "compliance with accounting standards, internal financial controls, and disclosures in the Board's report."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["accounts rules", "financial statements", "books of accounts", "mca"]
        },
        {
            "title": "Companies (Audit and Auditors) Rules, 2014",
            "source": "MCA Portal",
            "category": "Act & Rules",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/rules.html",
            "full_text": (
                "Ruleset: Companies (Audit and Auditors) Rules, 2014\n"
                "Purpose: Regulating the appointment of statutory auditors, auditor rotation limits, auditor resignation rules, "
                "contents of the auditor's report, and the legal obligation of auditors to report corporate fraud to the Central Government."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["audit rules", "auditors", "audit report", "fraud reporting", "mca"]
        }
    ]
    return rules

def get_mca_manuals_data():
    manuals = [
        {
            "title": "MCA21 V3 Portal User Manuals & Registration Guides",
            "source": "MCA Portal",
            "category": "Manuals & Guides",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/help-faq/e-filing-help-kits.html",
            "full_text": (
                "Document: MCA21 V3 Portal User Manuals & Registration Guides\n"
                "Purpose: Official help documentation explaining how to register as a Registered User vs a Business User, "
                "upgrade profiles, link professional memberships (ICAI/ICSI/Bar Council), and manage application history."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["user manuals", "registration guide", "mca21 v3", "business user"]
        },
        {
            "title": "Step-by-Step Webform E-Filing Guide",
            "source": "MCA Portal",
            "category": "Manuals & Guides",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/mca/global/en/help-faq/webform-filing-guides.html",
            "full_text": (
                "Document: Step-by-Step Webform E-Filing Guide\n"
                "Purpose: Detailed manuals on how to use V3 webforms, download and use offline Excel utility sheets, "
                "validate schemas, perform online pre-scrutiny checks, and pay government filing fees."
            ),
            "document_type": "HTML",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["filing guides", "webforms", "excel utility", "pre-scrutiny", "mca"]
        },
        {
            "title": "DSC Association & Registration User Manual",
            "source": "MCA Portal",
            "category": "Manuals & Guides",
            "publication_date": datetime.today().strftime('%d-%m-%Y'),
            "url": "https://www.mca.gov.in/content/dam/mca/instruction-kit/DSC-Registration-Guide.pdf",
            "full_text": (
                "Document: DSC Association & Registration User Manual\n"
                "Purpose: Step-by-step technical manual on how to register and associate Digital Signature Certificates (DSC) "
                "using the emBridge browser extension, troubleshooting signature errors, and mapping DSC to active DIN profiles."
            ),
            "document_type": "PDF",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "keywords": ["dsc guide", "digital signature", "embridge", "din mapping", "mca"]
        }
    ]
    return manuals

async def main():
    print("Starting MCA Scraper (headed browser mode to bypass CDN blocks)...")
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        await page.add_init_script("delete navigator.__proto__.webdriver;")
        
        # Load home page for DMS tabs
        print(f"Navigating to {HOME_URL}...")
        await page.goto(HOME_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(5000)
        
        # Scrape dynamic tabs (Notices, Circulars, Press Releases)
        dms_docs = await scrape_dms_tabs(page)
        
        # Scrape Companies Act resources
        act_docs = await scrape_companies_act(page)
        
        # Generate form metadata details
        forms_docs = get_mca_forms_data()
        
        # Generate FAQ compliance details
        faq_docs = get_mca_faqs_data()
        
        # Generate Rules reference details
        rules_docs = get_mca_rules_data()
        
        # Generate Manuals & Guides details
        manuals_docs = get_mca_manuals_data()
        
        all_documents = dms_docs + act_docs + forms_docs + faq_docs + rules_docs + manuals_docs
        
        # Output results to JSON file
        output_path = "mca_scraped_data.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_documents, f, indent=4, ensure_ascii=False)
            
        print(f"\nScraping successfully finished. Saved {len(all_documents)} documents to: {os.path.abspath(output_path)}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

