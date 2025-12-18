import { createHmac, randomBytes } from "crypto";

export const QRCODE_TIMEOUT = 15 * 1000;

export type QRPayload = {
  userId: string;
  exp: number;
  nonce: string;
};

export class QRSigner {
  key: CryptoKey;

  constructor(key: CryptoKey) {
    this.key = key;
  }

  async sign(message: string) {
    const signature = await crypto.subtle.sign(
      "HMAC",
      this.key,
      Buffer.from(message, "utf-8"),
    );

    return new Uint8Array(signature).toBase64({ alphabet: "base64url" });
  }

  verify(message: string, signature: string) {
    return crypto.subtle.verify(
      "HMAC",
      this.key,
      Buffer.from(signature, "base64url"),
      Buffer.from(message, "utf-8"),
    );
  }

  generateQRPayload(userId: string): QRPayload {
    const nonce = new Uint8Array(16);
    crypto.getRandomValues(nonce);

    return {
      userId,
      exp: Date.now() + QRCODE_TIMEOUT,
      nonce: nonce.toBase64({ alphabet: "base64url" }),
    };
  }

  generateToken(userId: string): string {
    const payloadJson = JSON.stringify(this.generateQRPayload(userId));
    const payloadBase64 = Buffer.from(payloadJson, "utf8").toString(
      "base64url",
    );
    const signature = this.sign(payloadBase64);
    return `${payloadBase64}.${signature}`;
  }

  async verifyToken(token: string): Promise<string> {
    const parts = token.split(".");
    if (parts.length !== 2) throw new Error("Invalid QR token");
    await this.verify(parts[0], parts[1]);
    const payload = JSON.parse(
      Buffer.from(parts[0], "base64url").toString(),
    ) as QRPayload;
    if (payload.exp > Date.now()) throw new Error("Expired signature");
    return payload.userId;
  }

  static async fromSecret(secret: string) {
    const key = await crypto.subtle.importKey(
      "raw",
      Buffer.from(secret, "base64url"),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

    return new QRSigner(key);
  }
}
