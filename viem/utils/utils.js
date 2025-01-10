import { http } from "viem";
import {
  publicKeyToAddress,
  privateKeyToAccount,
  privateKeyToAddress,
} from "viem/accounts";

import factory from "../../backend/artifacts/contracts/UniswapV2Factory.sol/UniswapV2Factory.json" assert { type: "json" };
import pair from "../../backend/artifacts/contracts/UniswapV2Pair.sol/UniswapV2Pair.json" assert { type: "json" };
import ERC20 from "../../backend/artifacts/contracts/MockERC20.sol/MockERC20.json" assert { type: "json" };
import router from "../../backend/artifacts/contracts/UniswapV2Router02.sol/UniswapV2Router02.json" assert { type: "json" };
import flashSwap from "../../backend/artifacts/contracts/FlashSwapExample.sol/FlashSwapExample.json" assert { type: "json" };

function privateKeyToPublicKey(private_key) {
  const account = privateKeyToAccount(`${private_key}`);
  return account.publicKey;
}

const ABI = {
  factory: factory.abi,
  pair: pair.abi,
  ERC20: ERC20.abi,
  router: router.abi,
  flashSwap: flashSwap.abi,
};

export const networks = {
  testnet: {
    url: "http://localhost:8545",
    transport: http("http://localhost:8545"),
  },
  sepolia: {
    url: "https://ethereum-sepolia-rpc.publicnode.com",
    transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
  custom: (url) => {
    return {
      url,
      transport: http(url),
    };
  },
};

export {
  publicKeyToAddress,
  privateKeyToAccount,
  privateKeyToAddress,
  privateKeyToPublicKey,
  ABI,
};
