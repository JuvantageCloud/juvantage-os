import Foundation

/// Same key as Electron/React `localStorage` for WKWebView injection.
enum TokenStore {
    private static let key = "juvantage_os_token"

    static var token: String? {
        get { UserDefaults.standard.string(forKey: key) }
        set {
            if let newValue {
                UserDefaults.standard.set(newValue, forKey: key)
            } else {
                UserDefaults.standard.removeObject(forKey: key)
            }
        }
    }
}
