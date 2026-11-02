import XCTest
final class PortfolioUITests: XCTestCase {
 @MainActor func scrollTo(_ item:XCUIElement,_ app:XCUIApplication,down:Bool=false){for _ in 0..<18 where !item.isHittable {if down{app.swipeDown()}else{app.swipeUp()}};XCTAssertTrue(item.isHittable)}
 @MainActor func testConsentDoesNotReturnAfterBoardRestored() throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"com.apple.mobilesafari");app.activate();let web=app.webViews.firstMatch
  XCTAssertTrue(web.waitForExistence(timeout:40))
  let summary=web.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@", "Review / copy puzzle code")).firstMatch
  XCTAssertTrue(summary.waitForExistence(timeout:30));scrollTo(summary,app);summary.tap()
  let consent=web.descendants(matching:.any).matching(NSPredicate(format:"label CONTAINS %@", "I reviewed this board/code")).firstMatch;XCTAssertTrue(consent.waitForExistence(timeout:10));scrollTo(consent,app);consent.tap()
  let copy=web.buttons["Copy reviewed puzzle code"];XCTAssertTrue(copy.waitForExistence(timeout:5));XCTAssertTrue(copy.isEnabled)
  let change=web.buttons["Change fictional board"];scrollTo(change,app,down:true);change.tap()
  scrollTo(copy,app);XCTAssertFalse(copy.isEnabled)
  let restore=web.buttons["Restore fictional board"];scrollTo(restore,app,down:true);restore.tap()
  scrollTo(copy,app);XCTAssertFalse(copy.isEnabled)
  scrollTo(consent,app);consent.tap();XCTAssertTrue(copy.isEnabled)
  let attachment=XCTAttachment(screenshot:app.screenshot());attachment.name="puzzle-review-fresh-consent";attachment.lifetime = .keepAlways;add(attachment)
 }
}
