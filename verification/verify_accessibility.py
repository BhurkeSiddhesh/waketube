from playwright.sync_api import sync_playwright, expect

def verify_accessibility(page):
    # 1. Arrange: Go to the app
    page.goto("http://localhost:3000")

    # 2. Act: Click the FAB to open the modal
    # FAB is likely an icon-only button at the bottom right
    # Based on tests: aria-label="Add new alarm"
    fab = page.get_by_label("Add new alarm")
    fab.click()

    # 3. Assert: Wait for modal and verify accessible inputs
    # These locators rely on the accessibility improvements I made

    # Label input associated with "Label" text
    label_input = page.get_by_label("Label", exact=True)
    expect(label_input).to_be_visible()

    # YouTube Video input associated with "YouTube Video" text
    # Note: The label has an icon, but get_by_label should handle the text content
    youtube_input = page.get_by_label("YouTube Video")
    expect(youtube_input).to_be_visible()

    # Time inputs (Hour/Minute)
    hour_select = page.get_by_label("Hour")
    expect(hour_select).to_be_visible()

    minute_select = page.get_by_label("Minute")
    expect(minute_select).to_be_visible()

    # Days - check for one of them
    monday_btn = page.get_by_label("Monday")
    expect(monday_btn).to_be_visible()

    # Recent Videos
    recent_select = page.get_by_label("Recent Videos")
    expect(recent_select).to_be_visible()

    print("Accessibility verification passed: All inputs found via labels!")

    # 4. Screenshot
    page.screenshot(path="verification/accessibility_check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_accessibility(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failure.png")
            raise
        finally:
            browser.close()
