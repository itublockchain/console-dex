import ERC20 from "../../viem/functions/ERC20.js";

async function getTokenBalance(tokenAddress, userAddress) {
  try {
    const token = new ERC20(tokenAddress);
    await token.getContract();
    return await token.getBalance(userAddress);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return 0;
  }
}

export default {
  getTokenBalance,
};
