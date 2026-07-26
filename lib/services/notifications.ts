export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  static async showLocalNotification(title: string, body: string, icon?: string): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    if (Notification.permission !== "granted") {
      const granted = await this.requestPermission()
      if (!granted) return false
    }

    // Try showing notification via Service Worker first for background execution support
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready
        if (reg) {
          reg.showNotification(title, {
            body,
            icon: icon || "/favicon.ico",
            badge: "/favicon.ico",
            vibrate: [200, 100, 200]
          } as any)
          return true
        }
      } catch (err) {
        console.warn("ServiceWorker notification failed, falling back to window Notification:", err)
      }
    }

    // Fallback to basic client window Notification
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico"
    })
    return true
  }
}
