import { auth } from "./auth";

if (!Uint8Array.prototype.toBase64) {
  Object.defineProperty(Uint8Array.prototype, 'toBase64', {
    value: function(options: { alphabet?: string, omitPadding?: boolean } = {}) {
      const alphabet = options.alphabet === 'base64url'
        ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

      const omitPadding = options.omitPadding || false;
      let base64 = "";

      for (let i = 0; i < this.length; i += 3) {
        const byte1 = this[i];
        const byte2 = i + 1 < this.length ? this[i + 1] : null;
        const byte3 = i + 2 < this.length ? this[i + 2] : null;

        // Combine bits into a 24-bit chunk
        const chunk = (byte1 << 16) | ((byte2 || 0) << 8) | (byte3 || 0);

        base64 += alphabet[(chunk >> 18) & 63];
        base64 += alphabet[(chunk >> 12) & 63];

        if (byte2 !== null) {
          base64 += alphabet[(chunk >> 6) & 63];
        } else if (!omitPadding) {
          base64 += "=";
        }

        if (byte3 !== null) {
          base64 += alphabet[chunk & 63];
        } else if (!omitPadding) {
          base64 += "=";
        }
      }

      return base64;
    },
    enumerable: false,
    configurable: true,
    writable: true
  });
}
if (!Uint8Array.fromBase64) {
  Object.defineProperty(Uint8Array, 'fromBase64', {
    value: function(base64String: string, options: { alphabet?: string } = {}) {
      if (typeof base64String !== 'string') {
        throw new TypeError("The 'base64String' argument must be a string.");
      }

      const alphabet = options.alphabet === 'base64url'
        ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

      // Build a lookup table for speed (char -> 6-bit value)
      const lookup = new Uint8Array(256);
      for (let i = 0; i < alphabet.length; i++) {
        lookup[alphabet.charCodeAt(i)] = i;
      }

      // Remove padding and whitespace for processing
      const cleaned = base64String.replace(/[=\s]/g, '');
      const len = cleaned.length;
      const bytes = new Uint8Array(Math.floor((len * 6) / 8));

      let p = 0;
      for (let i = 0; i < len; i += 4) {
        const char1 = lookup[cleaned.charCodeAt(i)];
        const char2 = lookup[cleaned.charCodeAt(i + 1)];
        const char3 = i + 2 < len ? lookup[cleaned.charCodeAt(i + 2)] : null;
        const char4 = i + 3 < len ? lookup[cleaned.charCodeAt(i + 3)] : null;

        // First byte: all 6 bits of char1 + top 2 bits of char2
        bytes[p++] = (char1 << 2) | (char2 >> 4);

        // Second byte: bottom 4 bits of char2 + top 4 bits of char3
        if (char3 !== null) {
          bytes[p++] = ((char2 & 15) << 4) | (char3 >> 2);
        }

        // Third byte: bottom 2 bits of char3 + all 6 bits of char4
        if (char4 !== null) {
          bytes[p++] = (((char3 ?? 0) & 3) << 6) | char4;
        }
      }

      return bytes;
    },
    enumerable: false,
    configurable: true,
    writable: true
  });
}

export const QRCODE_TIMEOUT = 60 * 1000;

export type QRPayload = {
  userId: string;
  userName: string;
  exp: number;
  nonce: string;
};

export class QRSigner {
  privateKey?: CryptoKey;
  publicKey: CryptoKey;

  constructor(opts: { privateKey?: CryptoKey; publicKey: CryptoKey }) {
    this.privateKey = opts.privateKey;
    this.publicKey = opts.publicKey;
  }

  /* ---------------- signing ---------------- */

  async sign(message: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error("Private key not available for signing");
    }

    const signature = await crypto.subtle.sign(
      { name: "Ed25519" },
      this.privateKey,
      Buffer.from(message, "utf-8"),
    );

    return new Uint8Array(signature).toBase64({ alphabet: "base64url" });
  }

  /* ---------------- verify ---------------- */

  async verify(message: string, signature: string): Promise<boolean> {
    return crypto.subtle.verify(
      { name: "Ed25519" },
      this.publicKey,
      Uint8Array.fromBase64(signature, { alphabet: "base64url" }),
      new TextEncoder().encode(message),
    );
  }

  /* ---------------- payload ---------------- */

  generateQRPayload(session: typeof auth.$Infer.Session): QRPayload {
    const nonce = new Uint8Array(16);
    crypto.getRandomValues(nonce);

    return {
      userId: session.user.id,
      userName: session.user.name,
      exp: Date.now() + QRCODE_TIMEOUT,
      nonce: nonce.toBase64({ alphabet: "base64url" }),
    };
  }

  /* ---------------- token ---------------- */

  async generateToken(session: typeof auth.$Infer.Session): Promise<string> {
    const payload = this.generateQRPayload(session);
    const payloadJson = JSON.stringify(payload);
    const payloadBase64 = new TextEncoder()
      .encode(payloadJson)
      .toBase64({ alphabet: "base64url" });

    const signature = await this.sign(payloadBase64);
    return `${payloadBase64}.${signature}`;
  }

  async generateUrl(
    session: typeof auth.$Infer.Session,
    baseUrl: string,
  ): Promise<string> {
    const token = await this.generateToken(session);
    const url = new URL(baseUrl);
    url.searchParams.set("token", token);
    return url.toString();
  }

  async verifyToken(token: string, expCheck?: boolean): Promise<QRPayload> {
    const parts = token.split(".");
    if (parts.length !== 2) throw new Error("Invalid QR token");

    const [payloadB64, sigB64] = parts;

    const ok = await this.verify(payloadB64, sigB64);
    if (!ok) throw new Error("Invalid signature");

    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.fromBase64(payloadB64, { alphabet: "base64url" }),
      ),
    ) as QRPayload;

    // since the server and scanner might have slight time differences,
    // we make the expiration check optional
    if (expCheck !== false && payload.exp < Date.now())
      throw new Error("Expired signature");

    return payload;
  }

  async verifyUrl(url: string, expCheck?: boolean): Promise<QRPayload> {
    try {
      // TODO: maybe filter hostname and etc?
      // tbh not really necessary since the token itself is signed
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get("token");
      if (!token) throw new Error("No token in URL");
      return await this.verifyToken(token, expCheck);
    } catch (err) {
      throw err;
    }
  }

  /* ---------------- factories ---------------- */

  /** Server-side: private + public key */
  static async fromPrivateKey(
    privateKeyBase64: string,
    publicKeyBase64: string,
  ) {
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      Buffer.from(privateKeyBase64, "base64"),
      { name: "Ed25519" },
      false,
      ["sign"],
    );

    const publicKey = await crypto.subtle.importKey(
      "spki",
      Buffer.from(publicKeyBase64, "base64"),
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    return new QRSigner({ privateKey, publicKey });
  }

  /** Scanner-side: public key only */
  static async fromPublicKey(publicKeyBase64: string) {
    const publicKey = await crypto.subtle.importKey(
      "spki",
      Buffer.from(publicKeyBase64, "base64"),
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    return new QRSigner({ publicKey });
  }
}
