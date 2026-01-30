
/**
 * SecurityService provides cryptographic utilities for the POS.
 * Uses Web Crypto API (SubtleCrypto) for high-performance encryption.
 */

export class SecurityService {
  private static ITERATIONS = 100000;
  private static SALT = new TextEncoder().encode('SariSariSalt_2024');
  private static STORAGE_KEY_NAME = 'sys_skey_v1';

  /**
   * Helper to convert Uint8Array to Base64 without stack overflow.
   */
  private static bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper to convert Base64 to Uint8Array safely.
   */
  private static base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Retrieves or Generates a persistent System Encryption Key.
   */
  private static async getSystemKey(): Promise<CryptoKey> {
    const rawKey = localStorage.getItem(this.STORAGE_KEY_NAME);
    
    if (!rawKey) {
      // Generate new key if none exists
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const exported = await window.crypto.subtle.exportKey('jwk', key);
      localStorage.setItem(this.STORAGE_KEY_NAME, JSON.stringify(exported));
      return key;
    }

    return window.crypto.subtle.importKey(
      'jwk',
      JSON.parse(rawKey),
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates a secure hash of a PIN for storage.
   */
  static async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Securely saves data to localStorage using AES-GCM encryption.
   */
  static async secureSave(key: string, data: any): Promise<void> {
    try {
      const cryptoKey = await this.getSystemKey();
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(data));
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
      
      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encodedData
      );

      // Pack IV and Ciphertext together
      const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedContent), iv.length);
      
      localStorage.setItem(key, this.bytesToBase64(combined));
    } catch (e) {
      console.error(`SecurityService: Failed to save ${key}`, e);
    }
  }

  /**
   * Loads data from localStorage, attempting to decrypt it.
   * Falls back to plain JSON parsing if decryption fails (Migration Strategy).
   */
  static async secureLoad<T>(key: string, defaultValue: T): Promise<T> {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;

    try {
      // 1. Try to treat as encrypted blob
      const combined = this.base64ToBytes(raw);
      
      // Basic check: encrypted data usually doesn't start with { or [ char codes
      // But we just try-catch the decrypt process.
      
      const cryptoKey = await this.getSystemKey();
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedBuffer));
    } catch (e) {
      // 2. Decryption failed? It might be old plain-text data.
      try {
        return JSON.parse(raw);
      } catch (jsonError) {
        console.warn(`SecurityService: Data corruption for ${key}, resetting to default.`);
        return defaultValue;
      }
    }
  }

  /**
   * Encrypts data using a PIN-derived key (User specific).
   */
  static async encrypt(data: any, pin: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const rawData = encoder.encode(JSON.stringify(data));
      
      const baseKey = await window.crypto.subtle.importKey(
        'raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']
      );
      const key = await window.crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: this.SALT, iterations: this.ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        rawData
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return this.bytesToBase64(combined);
    } catch (e) {
      console.error("Encryption failed", e);
      return "";
    }
  }

  /**
   * Decrypts data using a PIN-derived key (User specific).
   */
  static async decrypt(encryptedBase64: string, pin: string): Promise<any | null> {
    try {
      const combined = this.base64ToBytes(encryptedBase64);
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const baseKey = await window.crypto.subtle.importKey(
        'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']
      );
      const key = await window.crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: this.SALT, iterations: this.ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
      console.error("Decryption failed", e);
      return null;
    }
  }
}
