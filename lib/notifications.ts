// Notification and Alert Utility (iFood-Level)

let audio: HTMLAudioElement | null = null;
let initialized = false;

/**
 * Initialize audio context (Must be called by a user gesture)
 */
export async function initSound() {
  if (typeof window === 'undefined') return false;
  if (initialized && audio) return true;
  
  try {
    // Usar o som local alert.mp3 que já existe no diretório public
    audio = new Audio("/alert.mp3");
    audio.volume = 1;
    audio.loop = true; // Habilitar loop nativo
    
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
  if (!audio) {
    if (typeof window !== 'undefined') {
      audio = new Audio("/alert.mp3");
      audio.volume = 1;
      audio.loop = true;
    }
  }
  
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.warn("🔇 Audio play blocked/failed. Interaction required.", err);
    });
  }
}

/**
 * Stop the alert
 */
export function stopAlert() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
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

export async function sendBrowserNotification(order: any) {
  if (typeof window === 'undefined') return;
  
  const title = "Novo pedido recebido! 🚀";
  const body = `Cliente: ${order.customer?.name || order.customer_name || 'Cliente'}\nPedido: #${order.code || order.id?.slice(-4).toUpperCase()}\nTotal: R$ ${Number(order.total || 0).toFixed(2)}`;
  
  if ("Notification" in window && Notification.permission === "granted") {
    // Tentar via Service Worker para suporte a segundo plano profissional
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg) {
          reg.showNotification(title, {
            body,
            icon: "/logo_cupcake.png",
            badge: "/favicon.png",
            tag: order.id || "new-order",
            requireInteraction: true
          });
          return;
        }
      } catch (err) {
        console.warn("SW notification failed, falling back to window Notification", err);
      }
    }
    
    // Fallback para notificação nativa simples
    const n = new Notification(title, {
      body,
      icon: "/logo_cupcake.png",
      tag: order.id || "new-order",
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
