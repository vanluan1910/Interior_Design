/**
 * Tiện ích gửi thông báo đẩy trực tiếp ra màn hình Desktop (Windows / macOS)
 * Giống như thông báo Zalo, Facebook, Outlook...
 */

export interface DesktopNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

/**
 * Phát âm thanh chuông "Ting ting" sang trọng bằng Web Audio API
 */
export function playChimeSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Nốt 1: E6 (1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, ctx.currentTime);
    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Nốt 2: A6 (1760 Hz) - Âm ngân cao trong trẻo
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn('AudioContext sound failed:', err);
  }
}

/**
 * Kiểm tra trình duyệt có hỗ trợ Notification không
 */
export function isDesktopNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Lấy trạng thái quyền thông báo hiện tại ('granted' | 'denied' | 'default')
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isDesktopNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Yêu cầu cấp quyền hiển thị thông báo màn hình
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isDesktopNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Bắn thông báo ra góc màn hình máy tính (Desktop Notification)
 */
export function triggerDesktopNotification(
  title: string,
  options: DesktopNotificationOptions = {}
): boolean {
  if (!isDesktopNotificationSupported()) return false;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/logo.png',
        badge: '/logo.png',
        tag: options.tag || `d2_notif_${Date.now()}`,
        requireInteraction: options.requireInteraction ?? false,
      });

      if (options.onClick) {
        notif.onclick = () => {
          try {
            window.focus();
          } catch {}
          options.onClick!();
          notif.close();
        };
      }

      // Tự động đóng sau 8 giây nếu không requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => {
          try {
            notif.close();
          } catch {}
        }, 8000);
      }

      return true;
    } catch (err) {
      console.warn('Could not trigger native notification:', err);
      return false;
    }
  }

  return false;
}
