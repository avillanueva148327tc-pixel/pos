
/**
 * SecurityService provides cryptographic utilities for the POS.
 * Uses Web Crypto API (SubtleCrypto) for high-performance encryption.
 */

export class SecurityService {
  private static ITERATIONS = 100000;
  private static SALT = new TextEncoder().encode('SariSariSalt_2024');

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
   * Encrypts data using a PIN-derived key.
   */
  static async encrypt(data: any, pin: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const rawData = encoder.encode(JSON.stringify(data));
      
      // Derive key from PIN
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

      // Combine IV and Encrypted Data
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
   * Decrypts data using a PIN-derived key.
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
