import crypto from "crypto"
import bcrypt from "bcryptjs"

const ALGORITHM = "aes-256-cbc"

// Get key of exactly 32 bytes (256 bits) from ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error("Missing ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable")
  }
  return crypto.createHash("sha256").update(secret).digest()
}

/**
 * Encrypts a string using AES-256-CBC
 */
export function encrypt(text: string): string {
  if (!text) return ""
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    // Return iv and encrypted text concatenated with a colon
    return `${iv.toString("hex")}:${encrypted}`
  } catch (error) {
    console.error("Encryption failed:", error)
    throw new Error("Falha na criptografia de dados")
  }
}

/**
 * Decrypts an AES-256-CBC encrypted string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ""
  try {
    const parts = encryptedText.split(":")
    if (parts.length !== 2) {
      throw new Error("Formato de texto criptografado inválido")
    }
    const iv = Buffer.from(parts[0], "hex")
    const encrypted = parts[1]
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error)
    return ""
  }
}

/**
 * Hashes a password using Bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

/**
 * Compares a plain password with its Bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generates an encrypted session token for secure financial area access
 */
export function generateFinanceSessionToken(tenantId: string, expiresMinutes: number): string {
  const payload = {
    tenantId,
    expiresAt: Date.now() + expiresMinutes * 60 * 1000
  }
  return encrypt(JSON.stringify(payload))
}

/**
 * Verifies and decodes an encrypted financial session token
 */
export function verifyFinanceSessionToken(token: string): { tenantId: string; expiresAt: number } | null {
  if (!token) return null
  try {
    const decrypted = decrypt(token)
    if (!decrypted) return null
    const payload = JSON.parse(decrypted)
    
    if (typeof payload !== "object" || !payload.tenantId || !payload.expiresAt) {
      return null
    }

    if (Date.now() > payload.expiresAt) {
      return null // Expired
    }

    return payload
  } catch (error) {
    console.error("Failed to verify finance session token:", error)
    return null
  }
}
