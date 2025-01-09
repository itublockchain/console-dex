// Gerekli servislerin ve yardımcı fonksiyonların import edilmesi
import WalletService from "../services/wallet_service.js";
import { privateKeyToPublicKey } from "../../viem/utils/utils.js";
import wrap from "../utils/wrap_async.js";

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
    this.encrypted_private_key = wallet.encrypted_private_key;

    this.logged_in = true;
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
  getCurrentWallet() {
    return this.current_wallet;
  }

  getWallets() {
    return WalletService.getWallets();
  }

  // Özel anahtarı döndüren fonksiyon
  getPrivateKey(wallet_password) {
    const [private_key, err] = wrap(
      WalletService.getPrivateKey(this.public_key, wallet_password)
    );

    if (err) return console.log(chalk.red(err));

    return private_key;
  }
}

// Singleton pattern ile AuthManager örneğinin dışa aktarılması
export default new AuthManager();
