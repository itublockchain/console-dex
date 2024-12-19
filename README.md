### İTÜ Blockchain Klübü Devs Komitesi 1. Proje  

**Blockchain ağı üzerindeki swap işlemlerini ve pool mekanizmalarını simüle eden konsol uygulaması.**

## Kurulum ve Çalıştırma
```bash
git clone https://github.com/exTypen/itu-bc-console-app.git
cd itu-bc-console-app
npm install
cp .env_example .env
npm start
```

---

## Kullanılan Teknolojiler:
- Node.js
- Firebase

---

## Kullanılan Kütüphaneler:
- chalk
- inquirer
- crypto-js
- dotenv
- firebase

---

## Firebase Yapılandırması:

### Koleksiyonlar:

#### 1. Wallets
```json
[
  {
    "id": "4Do1g2gt9TPurfOhyXfq",
    "public_key": "f79cd12b3b0141d1f72c6642f668474125719c2a1b399f4c48932ebfaa2e1384",
    "balances": {
      "tokenA": 65114,
      "tokenB": 76529.66400106624
    }
  }
]
```

#### 2. Pools
```json
[
  {
    "id": "6IT5tYtwLa420cMymliE",
    "k": 1279974.4201012463,
    "token_1": {
      "tokenA": 1186.0094441794727
    },
    "token_2": {
      "tokenB": 1079.227847959324
    }
  }
]
```

## Katkıda Bulunanlar:
- [exTypen](https://github.com/exTypen)  
- [Meriç Cintosun](https://github.com/mericcintosun)  
- [AboveStars](https://github.com/aboveStars)  

