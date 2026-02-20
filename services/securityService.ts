import { ActivityLog } from '../types';

export class SecurityService {
  private static STORAGE_KEY_NAME = 'sys_skey_v3';
  private static writeTimeouts: Record<string, any> = {};
  private static locks: Record<string, boolean> = {};

  /**
   * Monitors Browser Persistence Health
   */
  static getStorageHealth() {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('db_')) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    const limit = 5 * 1024 * 1024; // 5MB standard browser limit
    const percent = (total / limit) * 100;
    return {
      usedBytes: total,
      usedKb: (total / 1024).toFixed(2),
      percent: percent.toFixed(1),
      status: percent > 85 ? 'critical' : percent > 60 ? 'warning' : 'healthy'
    };
  }

  /**
   * Background Pruning Process
   */
  static async vacuum(logs: ActivityLog[]): Promise<ActivityLog[]> {
    const health = this.getStorageHealth();
    if (parseFloat(health.percent) > 80) {
      console.warn("Storage High Entropy: Truncating Non-Essential Logs");
      return logs.slice(0, 50); // Keep only most recent 50 logs to save space
    }
    return logs;
  }

  private static async getSystemKey(): Promise<CryptoKey> {
    const rawKey = localStorage.getItem(this.STORAGE_KEY_NAME);
    if (!rawKey) {
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
      );
      const exported = await window.crypto.subtle.exportKey('jwk', key);
      localStorage.setItem(this.STORAGE_KEY_NAME, JSON.stringify(exported));
      return key;
    }
    return window.crypto.subtle.importKey(
      'jwk', JSON.parse(rawKey), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']
    );
  }

  static async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(pin));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Secure Persistent Storage with Write Mutex
   */
  static async secureSave(key: string, data: any): Promise<void> {
    if (SecurityService.writeTimeouts[key]) clearTimeout(SecurityService.writeTimeouts[key]);
    
    return new Promise((resolve) => {
      SecurityService.writeTimeouts[key] = setTimeout(async () => {
        // Prevent concurrent writes to the same key
        if (SecurityService.locks[key]) return;
        SecurityService.locks[key] = true;

        try {
          const cryptoKey = await SecurityService.getSystemKey();
          const encodedData = new TextEncoder().encode(JSON.stringify(data));
          const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
          
          const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encodedData);
          const combined = new Uint8Array(iv.length + encrypted.byteLength);
          combined.set(iv);
          combined.set(new Uint8Array(encrypted), iv.length);
          
          localStorage.setItem(`db_${key}`, btoa(String.fromCharCode(...combined)));
        } catch (e) {
          console.error(`Kernel IO Fault [${key}]: Database operation aborted.`);
        } finally {
          SecurityService.locks[key] = false;
          resolve();
        }
      }, 150); 
    });
  }

  static async secureLoad<T>(key: string, defaultValue: T): Promise<T> {
    const raw = localStorage.getItem(`db_${key}`);
    if (!raw) return defaultValue;
    try {
      const combined = new Uint8Array(atob(raw).split("").map(c => c.charCodeAt(0)));
      const cryptoKey = await SecurityService.getSystemKey();
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data);
      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
      console.warn(`Kernel Read Warning [${key}]: Data may be corrupted or key mismatch.`);
      return defaultValue;
    }
  }
}
