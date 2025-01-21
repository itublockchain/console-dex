import AES256 from "aes256";
import { createHash } from "crypto";

function AES256_decrypt(encrypted_data, password) {
  return AES256.decrypt(password, encrypted_data);
}

function AES256_encrypt(data, password) {
  return AES256.encrypt(password, data);
}

function SHA256(data) {
  return createHash("sha256").update(data).digest("hex");
}

export { AES256_decrypt, AES256_encrypt, SHA256 };
