import Foundation

/**
 * StatusBar plugin. Requires "View controller-based status bar appearance" to
 * be "YES" in Info.plist
 */
@objc(CAPStatusBarPlugin)
public class CAPStatusBarPlugin: CAPPlugin {

  override public func load() {
    NotificationCenter.default.addObserver(forName: CAPBridge.statusBarTappedNotification.name, object: .none, queue: .none) { [weak self] _ in
      self?.bridge?.triggerJSEvent(eventName: "statusTap", target: "window")
    }
  }

  @objc func setStyle(_ call: CAPPluginCall) {
    let options = call.options!

    if let style = options["style"] as? String {
      if style == "DARK" {
        bridge?.setStatusBarStyle(.lightContent)
      } else if style == "LIGHT" {
        if #available(iOS 13.0, *) {
          bridge?.setStatusBarStyle(.darkContent)
        } else {
          bridge?.setStatusBarStyle(.default)
        }
      }
    }

    call.success([:])
  }

  @objc func setBackgroundColor(_ call: CAPPluginCall) {
    call.unimplemented()
  }

  func setAnimation(_ call: CAPPluginCall) {
    let animation = call.getString("animation", "SLIDE")
    if animation == "FADE" {
      bridge?.setStatusBarAnimation(.fade)
    } else if animation == "NONE" {
      bridge?.setStatusBarAnimation(.none)
    } else {
      bridge?.setStatusBarAnimation(.slide)
    }
  }

  @objc func hide(_ call: CAPPluginCall) {
    setAnimation(call)
    bridge?.setStatusBarVisible(false)
    call.success()
  }

  @objc func show(_ call: CAPPluginCall) {
    setAnimation(call)
    bridge?.setStatusBarVisible(true)
    call.success()
  }

  @objc func getInfo(_ call: CAPPluginCall) {
    DispatchQueue.main.async { [weak self] in
      guard let bridge = self?.bridge else {
        return
      }
      let style: String
      if #available(iOS 13.0, *) {
        switch bridge.getStatusBarStyle() {
        case .default:
            if bridge.getUserInterfaceStyle() == UIUserInterfaceStyle.dark {
            style = "DARK"
          } else {
            style = "LIGHT"
          }
        case .lightContent:
          style = "DARK"
        default:
          style = "LIGHT"
        }
      } else {
        if bridge.getStatusBarStyle() == .lightContent {
          style = "DARK"
        } else {
          style = "LIGHT"
        }
      }

      call.success([
        "visible": bridge.getStatusBarVisible(),
        "style": style
      ])
    }
  }

  @objc func setOverlaysWebView(_ call: CAPPluginCall) {
    call.unimplemented()
  }
}
