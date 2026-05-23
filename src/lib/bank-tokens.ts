import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const algorithm = "aes-256-gcm";

export type BankTokenPayload = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  providerConsentId?: string;
};

export function encryptBankTokenPayload(payload: BankTokenPayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptBankTokenPayload(value: string): BankTokenPayload {
  const [version, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  if (version !== "v1" || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Nieobsługiwany format zaszyfrowanego tokenu bankowego.");
  }

  const decipher = createDecipheriv(algorithm, encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as BankTokenPayload;
}

export function tokenLastFour(token: string) {
  return token.trim().slice(-4) || null;
}

function encryptionKey() {
  const configured = process.env.BANK_TOKEN_ENCRYPTION_KEY;
  if (configured) {
    const base64 = Buffer.from(configured, "base64");
    if (base64.length === 32) return base64;

    const hex = Buffer.from(configured, "hex");
    if (hex.length === 32) return hex;
  }

  const fallbackSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!fallbackSecret) {
    throw new Error("Brak BANK_TOKEN_ENCRYPTION_KEY albo AUTH_SECRET dla szyfrowania tokenów bankowych.");
  }
  return createHash("sha256").update(fallbackSecret).digest();
}
