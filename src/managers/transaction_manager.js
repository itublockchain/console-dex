// Gerekli servislerin ve yardımcı fonksiyonların import edilmesi
import WalletService from "../services/wallet_service.js";
import PoolService from "../services/pool_service.js";

// Token takası gerçekleştiren fonksiyon
async function swap(pool_name, token_in_address, amount) {
  try {
    const pool = await PoolService.getPoolByName(pool_name);

    await PoolService.swap(pool.address, token_in_address, amount);

    return true;
  } catch (error) {
    console.error("Error swapping tokens:", error);
    return false;
  }
}

async function addLiquidity(pool_name, token0_address, amount0) {
  const pool = await PoolService.getPoolByName(pool_name);

  for (let token in pool) {
    if (pool[token].address == token0_address) {
      await PoolService.addLiquidity(pool.address, token0_address, amount0);
    }
  }
}

// İşlem yöneticisi fonksiyonlarını dışa aktarma
export default {
  swap,
  addLiquidity,
};
