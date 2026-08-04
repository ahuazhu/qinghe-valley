import AppKit
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private let gameURL: URL = {
        let baseURL = "https://qinghe-valley.ahuazhu.chatgpt.site"
        let arguments = CommandLine.arguments
        if let marker = arguments.firstIndex(of: "--save-token"), arguments.indices.contains(marker + 1) {
            let token = arguments[marker + 1]
            if token.range(of: "^[a-f0-9-]{36}$", options: .regularExpression) != nil {
                return URL(string: "\(baseURL)/?save=\(token)")!
            }
        }
        return URL(string: baseURL)!
    }()

    func applicationDidFinishLaunching(_ notification: Notification) {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.setValue(false, forKey: "drawsBackground")

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "青禾谷"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.minSize = NSSize(width: 900, height: 620)
        window.contentView = webView
        window.center()
        window.makeKeyAndOrderFront(nil)

        buildMenu()
        loadGame()
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    private func loadGame() {
        webView.load(URLRequest(url: gameURL, cachePolicy: .reloadRevalidatingCacheData))
    }

    @objc private func reloadGame() {
        webView.reload()
    }

    @objc private func goBack() {
        if webView.canGoBack { webView.goBack() }
    }

    private func buildMenu() {
        let mainMenu = NSMenu()
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "关于青禾谷", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "退出青禾谷", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu

        let gameMenuItem = NSMenuItem()
        mainMenu.addItem(gameMenuItem)
        let gameMenu = NSMenu(title: "游戏")
        gameMenu.addItem(withTitle: "返回", action: #selector(goBack), keyEquivalent: "[")
        gameMenu.addItem(withTitle: "重新加载", action: #selector(reloadGame), keyEquivalent: "r")
        gameMenuItem.submenu = gameMenu
        NSApp.mainMenu = mainMenu
    }
}

let application = NSApplication.shared
let appDelegate = AppDelegate()
application.delegate = appDelegate
application.setActivationPolicy(.regular)
application.run()
