// Gerekli servislerin ve yardımcı fonksiyonların import edilmesi
import WalletService from "../services/wallet_service.js";
import { privateKeyToPublicKey } from "../../viem/utils/utils.js";
import wrap from "../utils/wrap_async.js";
import StorageManager from "./StorageManager.js";

import chalk from "chalk";

import { wallet_passwords } from "../../index.js";

// Kullanıcı kimlik doğrulama ve cüzdan yönetimi için AuthManager sınıfı
class AuthManager {
  constructor() {
    // Başlangıç durumunda kullanıcı giriş yapmamış olarak ayarlanır
    this.logged_in = false;
    this.current_wallet = null;
    this.encrypted_private_key = null;
  }

  // Kullanıcının gizli ifade ile giriş yapmasını sağlayan fonksiyon
  async login(private_key, wallet_key) {
    // Gizli ifadeden özel ve genel anahtarların oluşturulması

    const public_key = privateKeyToPublicKey(private_key);

    // Genel anahtar ile cüzdan bilgilerinin getirilmesi
    let wallet = await WalletService.getWalletByPublicKey(public_key);

    // Eğer cüzdan yoksa, yeni bir cüzdan oluşturulur
    if (!wallet) {
      let [new_wallet, err] = await wrap(
        WalletService.createWallet(private_key, wallet_key)
      );
      if (err) return;
      wallet = new_wallet;
    }

    // Giriş durumunun güncellenmesi ve cüzdan bilgilerinin saklanması
    this.current_wallet = wallet.address;
    this.public_key = wallet.public_key;
    this.encrypted_private_key = wallet.encrypted_private_key;

    this.logged_in = true;

    this.addWalletPassword(wallet_key);
    return this.logged_in;
  }

  // Kullanıcının çıkış yapmasını sağlayan fonksiyon
  disconnect() {
    this.logged_in = false;
    this.current_wallet = null;
    this.encrypted_private_key = null;
  }

  // Kullanıcının giriş durumunu kontrol eden fonksiyon
  isLoggedIn() {
    return this.logged_in;
  }

  // Mevcut cüzdan adresini döndüren fonksiyon
  getAddress() {
    return this.current_wallet;
  }

  async getWallets() {
    return StorageManager.getWallets();
  }

  async saveWallet(wallet) {
    const wallets = await this.getWallets();
    wallets.push(wallet);
    StorageManager.saveWallets(wallets);
  }

  getWalletPassword() {
    const wallet_password_idx = wallet_passwords.findIndex(
      ({ address }) => address == this.current_wallet
    );

    if (wallet_password_idx == -1)
      return console.log(chalk.red("Wallet not found"));

    return wallet_passwords[wallet_password_idx].wallet_key;
  }

  addWalletPassword(wallet_key) {
    if (!wallet_passwords.find(({ address }) => address == this.current_wallet))
      wallet_passwords.push({ address: this.current_wallet, wallet_key });
  }

  // Özel anahtarı döndüren fonksiyon
  async getPrivateKey() {
    const wallet_password = this.getWalletPassword();

    const private_key = await WalletService.getPrivateKey(
      this.public_key,
      wallet_password
    );

    return private_key;
  }
}

// Singleton pattern ile AuthManager örneğinin dışa aktarılması
export default new AuthManager();
