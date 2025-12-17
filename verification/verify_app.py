from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:3000")

            # Wait for content to load
            print("Waiting for content...")
            page.wait_for_selector("h1", timeout=5000)

            # Take screenshot of main page
            print("Taking screenshot of main page...")
            page.screenshot(path="verification/main_page.png")

            # Click add alarm button
            print("Clicking add alarm button...")
            page.click("button[class*='fixed bottom-8']")

            # Wait for modal
            print("Waiting for modal...")
            page.wait_for_selector("text=New Alarm", timeout=2000)

            # Try to search with empty key (should warn)
            print("Typing in search box...")
            page.fill("input[placeholder*='Epic Hans Zimmer']", "test query")

            # Setup dialog handler for the alert
            page.on("dialog", lambda dialog: dialog.accept())

            print("Clicking search...")
            page.click("button:has(svg.lucide-search)")

            # Wait a bit for potential alert/warning
            page.wait_for_timeout(1000)

            # Take screenshot of modal with potential error/warning state or just the modal
            print("Taking screenshot of modal...")
            page.screenshot(path="verification/modal_page.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
