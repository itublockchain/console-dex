// Gerekli servislerin ve yardımcı fonksiyonların import edilmesi
import walletService from "../services/wallet_service.js";
import HashUtils from "../utils/hash_utils.js";

// Kullanıcı kimlik doğrulama ve cüzdan yönetimi için AuthManager sınıfı
class AuthManager {
  constructor() {
    // Başlangıç durumunda kullanıcı giriş yapmamış olarak ayarlanır
    this.loggedIn = false;
    this.currentWallet = null;
    this.privateKey = null;
  }

  // Kullanıcının gizli ifade ile giriş yapmasını sağlayan fonksiyon
  async login(secretPhrase) {
    // Gizli ifadeden özel ve genel anahtarların oluşturulması
    const privateKey = HashUtils.sha256(secretPhrase);
    const publicKey = HashUtils.sha256(privateKey);

    // Genel anahtar ile cüzdan bilgilerinin getirilmesi
    const wallet = await walletService.getWalletByPublicKey(publicKey);

    // Eğer cüzdan yoksa, yeni bir cüzdan oluşturulur
    if (!wallet)
      await walletService.addWallet({
        public_key: publicKey,
        balances: { tokenA: 100, tokenB: 100 },
      });

    // Giriş durumunun güncellenmesi ve cüzdan bilgilerinin saklanması
    this.loggedIn = true;
    this.currentWallet = publicKey;
    this.privateKey = privateKey;
    return this.loggedIn;
  }

  // Kullanıcının çıkış yapmasını sağlayan fonksiyon
  disconnect() {
    this.loggedIn = false;
    this.currentWallet = null;
    this.privateKey = null;
  }

  // Kullanıcının giriş durumunu kontrol eden fonksiyon
  isLoggedIn() {
    return this.loggedIn;
  }

  // Mevcut cüzdan adresini döndüren fonksiyon
  getCurrentWallet() {
    return this.currentWallet;
  }

  // Özel anahtarı döndüren fonksiyon
  getPrivateKey() {
    return this.privateKey;
  }
}

// Singleton pattern ile AuthManager örneğinin dışa aktarılması
export default new AuthManager();
