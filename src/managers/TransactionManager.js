// Gerekli servislerin ve yardımcı fonksiyonların import edilmesi
import { debug_mode } from "../config.js";
import PoolService from "../services/pool_service.js";

// Token takası gerçekleştiren fonksiyon
async function swap(pool_name, token_in_address, amount) {
  try {
    const pool = await PoolService.getPoolByName(pool_name);

    await PoolService.swap(pool.address, token_in_address, amount);

    return true;
  } catch (error) {
    if (debug_mode) console.error("Error swapping tokens:", error);
    return false;
  }
}

async function addLiquidity(pool_name, token0_address, amount0) {
  try {
    const pool = await PoolService.getPoolByName(pool_name);
    if (!pool) {
      console.error("Pool not found");
      return false;
    }

    if (!token0_address || !amount0) {
      console.error("Missing token address or amount");
      return false;
    }

    // Validate token address exists in pool
    const tokenFound =
      pool.token0.address === token0_address ||
      pool.token1.address === token0_address;
    if (!tokenFound) {
      console.error("Token not found in pool");
      return false;
    }

    const result = await PoolService.addLiquidity(
      pool.address,
      token0_address,
      amount0
    );
    return result;
  } catch (err) {
    if (debug_mode) console.error("Transaction error:", err);
    return false;
  }
}

// İşlem yöneticisi fonksiyonlarını dışa aktarma
export default {
  swap,
  addLiquidity,
};
