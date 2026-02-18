from playwright.sync_api import sync_playwright

def verify_accessibility():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:4173")

        # 1. Verify Skip Link exists and has correct href
        skip_link = page.get_by_text("Skip to content")
        href = skip_link.get_attribute("href")
        print(f"Skip link found with href: {href}")
        if href != "#main-content":
            print("Error: Skip link href incorrect")

        # 2. Verify Main Content ID exists
        main_content = page.locator("#main-content")
        count = main_content.count()
        print(f"Main content ID found count: {count}")

        # 3. Verify FAB has aria-label
        # The FAB is the button with the Plus icon.
        # We can find it by its aria-label if it works!
        fab = page.get_by_label("Add alarm")
        if fab.count() > 0:
            print("FAB with aria-label 'Add alarm' found.")
        else:
            print("Error: FAB with aria-label not found.")

        # Focus the skip link to make it visible (since it has focus:not-sr-only)
        skip_link.focus()
        page.screenshot(path="verification/accessibility_check.png")

        browser.close()

if __name__ == "__main__":
    verify_accessibility()
