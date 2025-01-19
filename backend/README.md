# Backend Klasörü Ne Yapar, Nasıl Çalıştırılır? Adım adım.

## Backend ne yapıyor?

Backend klasörü aslında Uniswap V2 Forkumuzun kontratlarını otomatik olarak deploylayıp bize bir pool açıyor ve iki tokeni swaplıyor. Ardından bütün bu kontratların adreslerini Console-Dex'in kullanabilmesi için otomatik olarak "storage/address.json" dizinine yazdırıyor.

## 1) Terminalin doğru klasörde olduğundan emin olalım.

```
                                  Bakın doğru klasördeyim.
                                             |
0xkutluer@0xkutluer:~/Desktop/console-dex/backend$
```

## 2) Gereksinimleri indirelim.

- npm install

```bash
0xkutluer@0xkutluer:~/Desktop/console-dex/backend$ npm install
```

## 3) .env adlı bir dosya oluşturalım.

- **.env.EXAMPLE** adındaki dosyayı kopyalayalım ve .env adında bir dosya açalım.
- example şemasındakine uygun olarak istenen değerleri dolduralım.
- Başlangıç için bu readme dosyasının en sonunda hardhat'ın verdiği bir private keyi bıraktım.

* **Dikkat:** Metamask'ten alınan private key'ler **0x** ile başlamayabiliyor, siz keyinizin başına **0x** ekleyin.

```json
// .env.EXAMPLE
PRIVATE_KEY="0xsakjf..."
```

### 3O) Bu kısım opsiyoneldir. Eğer lokalde bir testnet çalıştırmak istiyorsanız şu kodu çalıştırın.

- Dikkat! - Bu bir lokal node çalıştırır ve kapatırsanız node duracaktır, deploy ettiğiniz kontratlarla birlikte veriler silinir.

```bash
0xkutluer@0xkutluer:~/Desktop/console-dex/backend$ npx hardhat node
```

## 4) Kodun testlerinin çalıştığından emin olalım.

```bash
0xkutluer@0xkutluer:~/Desktop/console-dex/backend$ npm run test
```

## 5) Lokal testnet, Sepolia testneti veya diğer ağlara deploy edelim.

```bash
// testnet için
0xkutluer@0xkutluer:~/Desktop/console-dex/backend$ npm run deploy-testnet

// Sepolia için
0xkutluer@0xkutluer:~/Desktop/console-dex/backend$ npm run deploy-sepolia

// Holesky için
0xkutluer@0xkutluer:~/Desktop/console-dex/backend$ npm run deploy-holesky
```

### 5O) Bu kısım opsiyoneldir.

- **backend/package.json** adındaki dosyadan scriptleri değiştirebilirsiniz.

## Final - Beklediğimiz çıktılar şu şekilde olmalı.

```json
// storage/addresses.json
// kontratların adresleri farklı olabilir.

{
  "testnet": {
    "token0": "0x06837d2eA4a27e7E1f75318Ce76Ae7Ce3Da6F564",
    "token1": "0xb5ce89939c5548D725761458C59D9A0f48DFBF42",
    "factory": "0xdE83b36598BF617dCC2dA64a5Ab021c2de11581F",
    "router": "0x4e3EA2CA17B70d54f8DE768E649EB33A8Cf86F33",
    "weth": "0x1C4A305713735EfFF46Df1b0402061c28d04D4FF",
    "pair": "0x65Db05F47A9d415B04c9c2aDbf516D3C31AA7E83"
  },
  "sepolia": {
    "token0": "0x36D5C33964620ec91c24293cCEcc31e0868692d7",
    "token1": "0x7624f2477E85C870c442419E0594CE38d12D6456",
    "factory": "0x21b5b69FbE5D3B404325753F239BdB0271550842",
    "router": "0xd085B6AB1e763D9619ECF1A823617554F84D7340",
    "weth": "0x982633f5d42C01F8BA849393E900c43634CFfe9f",
    "pair": "0x4a646fe7b7C25C523c856821b399332bFa683849"
  }
}
```

## Ekler

### Lokalde test etmek için:

Eğer kendi lokal bir node'unuz çalışıyorsa bu lokal testnete bağlanmak isteyebilirsiniz.
Bunu yapmak için hardhat.config.ts dosyasına gidip birkaç değişiklik yapmalısınız.

#### Eğer bir url'ye sahipseniz:

Bunu yapabilmenin iki farklı yolu var.

- 1. **storage/pre_defined_networks.json** adlı dosyayı düzenlemek.

```json
[
  ...
    // Daha temiz bir kod ve sistem için
    // "storage/pre_defined_networks.json" dizinindeki
    // dosyayı değiştirebilirsiniz.
    {
      "name": "testnet",
      "url": "http://127.0.0.1:8545" // Burası değişecek.
    },
    {
      "name": "sepolia",
      "url": "https://ethereum-sepolia-rpc.publicnode.com"
    },
   ...
]
```

---

- 2. **backend/hardhat.config.ts** adlı dosyayı düzenlemek.

```typescript
...
testnet: {
   // Alttaki URL kısmını bir string değeri ile değiştebilirsiniz.
      url: pre_defined_networks.find((ntw: any) => ntw.name === "testnet").url,
   // url: "http://localhost:8545" (Örnek)
      accounts: [process.env.PRIVATE_KEY],
      allowUnlimitedContractSize: true,
    },
...
```

---

### Örnek Private Key

- Bu private key hardhat'ın kendi verdiği key'lerden alınmıştır.

```bash
0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e
```
