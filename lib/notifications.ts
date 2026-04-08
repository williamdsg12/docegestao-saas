// Notification and Alert Utility (iFood-Level)

let audio: HTMLAudioElement | null = null;
let interval: any = null;

/**
 * Initialize audio context (Must be called by a user gesture)
 */
export function initSound() {
  if (typeof window === 'undefined') return;
  // Professional alert sound URL (Mixkit/Zapsplat style)
  audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  audio.volume = 1;
  console.log("🔊 Sound context initialized");
}

/**
 * Start the looped alert
 */
export function startAlert() {
  if (!audio) {
    console.warn("⚠️ Sound not initialized. Call initSound() first.");
    return;
  }

  play();

  // Loop every 2.5 seconds as requested
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    play();
  }, 2500);
}

/**
 * Stop the alert
 */
export function stopAlert() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

function play() {
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("🔇 Audio play blocked/failed:", err));
  }
}

/**
 * Browser Push Notifications
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !("Notification" in window)) return false;
  
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function sendBrowserNotification(order: any) {
  if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
    new Notification("Novo pedido recebido! 🚀", {
      body: `Pedido #${order.id?.slice(0, 8)} - R$ ${order.total?.toFixed(2)}`,
      icon: "/logo.png", // Ensure this exists or use a generic one
    });
  }
}

/**
 * Device Vibration
 */
export function vibrateDevice() {
  if (typeof window !== 'undefined' && "vibrate" in navigator) {
    navigator.vibrate([300, 100, 300, 100, 500]);
  }
}
