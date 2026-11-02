import XCTest
final class PortfolioUITests: XCTestCase {
 @MainActor func attach(_ app:XCUIApplication,_ name:String){let a=XCTAttachment(screenshot:app.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
 @MainActor func scrollTo(_ item:XCUIElement,_ app:XCUIApplication,down:Bool=false){for _ in 0..<18 where !item.isHittable {if down{app.swipeDown()}else{app.swipeUp()}};XCTAssertTrue(item.isHittable)}
 @MainActor func check(_ name:String,example:Bool) throws {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"com.apple.mobilesafari");app.activate();let web=app.webViews.firstMatch
  XCTAssertTrue(web.waitForExistence(timeout:40))
  if example {let load=web.buttons.matching(NSPredicate(format:"label CONTAINS %@", "Load Example")).firstMatch;XCTAssertTrue(load.waitForExistence(timeout:20));scrollTo(load,app,down:true);load.tap()}
  let explain=web.buttons["Explain my next move"];XCTAssertTrue(explain.waitForExistence(timeout:20));scrollTo(explain,app);explain.tap()
  let apply=web.buttons["Place only this deduction"]
  let none=web.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "No supported deduction found")).firstMatch
  let conflict=web.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "Check the entries")).firstMatch
  XCTAssertTrue(apply.waitForExistence(timeout:2) || none.exists || conflict.exists)
  attach(app,"puzzle-\(name)-explanation")
  let save=web.buttons["Save locally and keep saving changes"];scrollTo(save,app);save.tap()
  let resume=web.buttons["Resume my local board"];XCTAssertTrue(resume.waitForExistence(timeout:8));attach(app,"puzzle-\(name)-saved")
  scrollTo(resume,app);resume.tap()
  XCTAssertTrue(web.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "Local saving is on")).firstMatch.waitForExistence(timeout:8))
  let reset=web.buttons["Reset and forget local board"];scrollTo(reset,app);reset.tap();let confirm=web.buttons["Confirm reset and forget local board"];XCTAssertTrue(confirm.waitForExistence(timeout:8));confirm.tap()
  XCTAssertTrue(web.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "Local copy removed")).firstMatch.waitForExistence(timeout:8));XCTAssertFalse(resume.exists);attach(app,"puzzle-\(name)-forgotten")
 }
 @MainActor func testHeader() throws {
  continueAfterFailure=false;let app=XCUIApplication(bundleIdentifier:"com.apple.mobilesafari");app.activate();let web=app.webViews.firstMatch;XCTAssertTrue(web.waitForExistence(timeout:40))
  let home=web.links["PuzzleSolver home"], solvers=web.links["Solvers"], learn=web.links["Learn"]
  XCTAssertTrue(home.waitForExistence(timeout:20));XCTAssertTrue(solvers.exists);XCTAssertTrue(learn.exists)
  XCTAssertLessThanOrEqual(home.frame.maxX,solvers.frame.minX);XCTAssertLessThanOrEqual(solvers.frame.maxX,learn.frame.minX);attach(app,"puzzle-mobile-header")
 }
 @MainActor func testCleanup() throws {
  continueAfterFailure=false;let app=XCUIApplication(bundleIdentifier:"com.apple.mobilesafari");app.activate();let web=app.webViews.firstMatch;XCTAssertTrue(web.waitForExistence(timeout:40))
  let reset=web.buttons["Reset and forget local board"];XCTAssertTrue(reset.waitForExistence(timeout:20));scrollTo(reset,app);reset.tap();let confirm=web.buttons["Confirm reset and forget local board"];XCTAssertTrue(confirm.waitForExistence(timeout:8));confirm.tap();XCTAssertTrue(web.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "Local copy removed")).firstMatch.waitForExistence(timeout:8));attach(app,"puzzle-battleship-cleanup")
 }
 @MainActor func testBattleSaveForRestart() throws {
  continueAfterFailure=false;let app=XCUIApplication(bundleIdentifier:"com.apple.mobilesafari");app.activate();let web=app.webViews.firstMatch;XCTAssertTrue(web.waitForExistence(timeout:40))
  let load=web.buttons.matching(NSPredicate(format:"label CONTAINS %@", "Load Example")).firstMatch;XCTAssertTrue(load.waitForExistence(timeout:20));scrollTo(load,app,down:true);load.tap()
  let save=web.buttons["Save locally and keep saving changes"];scrollTo(save,app);save.tap();XCTAssertTrue(web.buttons["Resume my local board"].waitForExistence(timeout:8));attach(app,"puzzle-battle-production-saved")
 }
 @MainActor func testBattleRestartRestore() throws {
  continueAfterFailure=false;let app=XCUIApplication(bundleIdentifier:"com.apple.mobilesafari");app.activate();let web=app.webViews.firstMatch;XCTAssertTrue(web.waitForExistence(timeout:40))
  let resume=web.buttons["Resume my local board"];XCTAssertTrue(resume.waitForExistence(timeout:20));scrollTo(resume,app);resume.tap()
  let explain=web.buttons["Explain my next move"];scrollTo(explain,app,down:true);explain.tap()
  let rule=web.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "Ships cannot touch diagonally")).firstMatch;XCTAssertTrue(rule.waitForExistence(timeout:8));attach(app,"puzzle-battle-production-restored-hint")
  let reset=web.buttons["Reset and forget local board"];scrollTo(reset,app);reset.tap();let confirm=web.buttons["Confirm reset and forget local board"];XCTAssertTrue(confirm.waitForExistence(timeout:8));confirm.tap()
  XCTAssertTrue(web.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "Local copy removed")).firstMatch.waitForExistence(timeout:8));XCTAssertFalse(resume.exists);attach(app,"puzzle-battle-production-forgotten")
 }
 @MainActor func testBattle() throws {try check("battleship",example:true)}
 @MainActor func testSky() throws {try check("skyscraper",example:false)}
 @MainActor func testLoop() throws {try check("slitherlink",example:true)}
}
