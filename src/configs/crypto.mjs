
"use client";

// ES Module
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

// เข้ารหัส (Encrypt)
export const cryptoEncode = async (data) => {
  const key = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY;
  if (!key) throw new Error("Key is not defined in .env");

  if (typeof data === "object") {
    data = JSON.stringify(data);
  }

  return AES.encrypt(data, key).toString();
};

// ถอดรหัส (Decrypt)
export const cryptoDecode = async (encryptedText) => {
  const key = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY;
  if (!key) throw new Error("Key is not defined in .env");

  const decrypted = AES.decrypt(encryptedText, key).toString(Utf8);
  try {
    return JSON.parse(decrypted);
  } catch (error) {
    return decrypted;
  }
};
