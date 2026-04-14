// Notification and Alert Utility (iFood-Level)

let audio: HTMLAudioElement | null = null;
let interval: any = null;
let initialized = false;

/**
 * Initialize audio context (Must be called by a user gesture)
 */
export async function initSound() {
  if (typeof window === 'undefined') return false;
  
  try {
    // Usar o som local alert.mp3 que já existe no diretório public
    audio = new Audio("/alert.mp3");
    audio.volume = 1;
    
    // Tentar um play/pause rápido para desbloquear o contexto de áudio
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    
    initialized = true;
    console.log("🔊 Sound context initialized and unlocked");
    return true;
  } catch (err) {
    console.error("❌ Failed to initialize sound:", err);
    return false;
  }
}

/**
 * Checks if sound is initialized
 */
export function isSoundEnabled() {
  return initialized;
}

/**
 * Start the looped alert
 */
export function startAlert() {
  if (!audio || !initialized) {
    console.warn("⚠️ Sound not initialized or blocked. User interaction required.");
    return;
  }

  play();

  // Loop every 3 seconds for new orders
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    play();
  }, 3000);
}

/**
 * Stop the alert
 */
export function stopAlert() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function play() {
  if (audio && initialized) {
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("🔇 Audio play blocked/failed:", err));
  }
}

/**
 * Browser Push Notifications
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !("Notification" in window)) return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    return false;
  }
}

export function sendBrowserNotification(order: any) {
  if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
    const n = new Notification("Novo pedido recebido! 🚀", {
      body: `Valor: R$ ${order.total?.toFixed(2)} - Clique para ver`,
      icon: "/favicon.png", // Use a generic favicon if logo.png is missing
      tag: "new-order", // Avoid multiple popups for the same order
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
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
/**
 * Plays a short, distinct beep for delayed orders (Web Audio API)
 */
export function playDelayedBeep() {
    if (typeof window === 'undefined') return;
    
    try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 note
        oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1); // Slide up
        
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
    } catch (e) {
        console.warn("Audio Context beep failed", e);
    }
}
