// Gerekli servislerin ve yardımcı fonksiyonların import edilmesi
import walletService from "../services/wallet_service.js";
import poolService from "../services/pool_service.js";
import { SHA256 } from "../utils/encryption_utils.js";
import chalk from "chalk";
import inquirer from "inquirer";

// Token takası gerçekleştiren fonksiyon
async function swap(privateKey, poolId, token, amount) {
  try {
    // Private key'den Public key oluşturma
    const publicKey = SHA256(privateKey);

    // Public key ile cüzdan bilgilerini getirme
    const wallet = await walletService.getWalletByPublicKey(publicKey);
    if (!wallet) {
      throw new Error("Wallet not found for the provided private key.");
    }

    // Havuz bilgilerini getirme
    const pool = await poolService.getPoolById(poolId);
    if (!pool) {
      throw new Error("Pool not found for the provided pool ID.");
    }

    // Havuzdaki token çiftlerini belirleme
    const token1 = Object.keys(pool.token_1)[0];
    const token2 = Object.keys(pool.token_2)[0];
    const targetToken = token === token1 ? token2 : token1;

    const token1Amount = pool.token_1[token1];
    const token2Amount = pool.token_2[token2];
    const k = pool.k; // Sabit çarpım değeri (x * y = k)

    // Cüzdan bakiyesi kontrolü
    if (!wallet.balances[token] || wallet.balances[token] < amount)
      throw new Error(`Insufficient ${token} balance.`);

    // Havuz token miktarlarını güncelleme ve hedef token miktarını hesaplama
    const updatedTokenAmount =
      token === token1 ? token1Amount + amount : token2Amount + amount;
    const updatedTargetTokenAmount = k / updatedTokenAmount;
    const targetTokenDelta =
      (token === token1 ? token2Amount : token1Amount) -
      updatedTargetTokenAmount;

    // İşlem detaylarını gösterme
    console.log("Transaction details: \n");
    console.log(
      `${chalk.blue.bold(token)}: ${chalk.yellow.bold(amount.toFixed(3))}`
    );
    console.log(
      `${chalk.blue.bold(targetToken)}: ${chalk.yellow.bold(
        targetTokenDelta.toFixed(3)
      )}`
    );

    // Kullanıcıdan onay alma
    const { confirm } = await inquirer.prompt([
      {
        type: "list",
        name: "confirm",
        message: "Do you confirm the transaction?",
        choices: ["Yes", "No"],
      },
    ]);

    if (confirm !== "Yes") {
      console.log("Transaction canceled.");
      return;
    }

    // Hedef token miktarı kontrolü
    if (targetTokenDelta <= 0) {
      throw new Error(
        "Swap amount is too small to provide a meaningful target token output."
      );
    }

    // Cüzdan bakiyelerini güncelleme
    wallet.balances[token] -= amount;
    wallet.balances[targetToken] =
      (wallet.balances[targetToken] || 0) + targetTokenDelta;

    // Havuz token miktarlarını güncelleme
    if (token === token1) {
      pool.token_1[token1] += amount;
      pool.token_2[token2] = updatedTargetTokenAmount;
    } else {
      pool.token_2[token2] += amount;
      pool.token_1[token1] = updatedTargetTokenAmount;
    }

    // Veritabanında cüzdan ve havuz bilgilerini güncelleme
    const walletUpdateResult = await walletService.updateWallet(wallet);
    const poolUpdateResult = await poolService.updatePool(pool);

    if (!walletUpdateResult || !poolUpdateResult) {
      throw new Error("Failed to update wallet or pool after swap.");
    }

    console.log(
      `Successfully swapped ${amount} ${token} for ${targetTokenDelta.toFixed(
        6
      )} ${targetToken}.`
    );
    return { wallet, pool };
  } catch (error) {
    console.error("Error during swap operation:", error.message);
    throw error;
  }
}

// Havuza likidite ekleme fonksiyonu
async function addLiquidity(privateKey, poolId, token, amount) {
  // Private key'den Public key oluşturma
  const publicKey = SHA256(privateKey);

  // Public key ile cüzdan bilgilerini getirme
  const wallet = await walletService.getWalletByPublicKey(publicKey);
  if (!wallet) {
    throw new Error("Wallet not found for the provided private key.");
  }

  // Havuz bilgilerini getirme
  const pool = await poolService.getPoolById(poolId);
  if (!pool) {
    throw new Error("Pool not found for the provided pool ID.");
  }

  // Havuzdaki token çiftlerini belirleme
  const token1 = Object.keys(pool.token_1)[0];
  const token2 = Object.keys(pool.token_2)[0];
  const targetToken = token === token1 ? token2 : token1;

  // Mevcut havuz oranlarını hesaplama
  const token1PoolAmount = pool.token_1[token1];
  const token2PoolAmount = pool.token_2[token2];
  const currentTokenRatio =
    token === token1
      ? token2PoolAmount / token1PoolAmount
      : token1PoolAmount / token2PoolAmount;

  // Gerekli hedef token miktarını hesaplama
  const requiredTargetTokenAmount = amount * currentTokenRatio;

  // Cüzdan bakiyesi kontrolü
  if (
    !wallet.balances[token] ||
    wallet.balances[token] < amount ||
    !wallet.balances[targetToken] ||
    wallet.balances[targetToken] < requiredTargetTokenAmount
  ) {
    console.log("Insufficient token balance.");
  } else {
    // İşlem detaylarını gösterme
    console.log("Transaction details: \n");
    console.log(
      `${chalk.blue.bold(token)}: ${chalk.yellow.bold(amount.toFixed(3))}`
    );
    console.log(
      `${chalk.blue.bold(targetToken)}: ${chalk.yellow.bold(
        requiredTargetTokenAmount.toFixed(3)
      )}`
    );

    // Kullanıcıdan onay alma
    const { confirm } = await inquirer.prompt([
      {
        type: "list",
        name: "confirm",
        message: "Do you confirm the transaction?",
        choices: ["Yes", "No"],
      },
    ]);

    if (confirm !== "Yes") {
      console.log("Transaction canceled.");
      return;
    }

    // Havuz token miktarlarını ve k değerini güncelleme
    let newK = 0;
    if (Object.keys(pool.token_1)[0] == token) {
      pool.token_1[token] += amount;
      pool.token_2[targetToken] += requiredTargetTokenAmount;
      newK =
        (token1PoolAmount + amount) *
        (token2PoolAmount + requiredTargetTokenAmount);
    } else {
      pool.token_2[token] += amount;
      pool.token_1[targetToken] += requiredTargetTokenAmount;
      newK =
        (token2PoolAmount + amount) *
        (token1PoolAmount + requiredTargetTokenAmount);
    }
    pool.k = newK;

    // Veritabanında havuz bilgilerini güncelleme
    await poolService.updatePool(pool);

    // Cüzdan bakiyelerini güncelleme
    wallet.balances[token] = wallet.balances[token] - amount;
    wallet.balances[targetToken] =
      wallet.balances[targetToken] - requiredTargetTokenAmount;

    // Veritabanında cüzdan bilgilerini güncelleme
    await walletService.updateWallet(wallet);
  }
  console.log(
    `Successfully added liquidity ${amount} ${token} for ${requiredTargetTokenAmount.toFixed(
      6
    )} ${targetToken}.`
  );
}

// İşlem yöneticisi fonksiyonlarını dışa aktarma
export default {
  swap,
  addLiquidity,
};
