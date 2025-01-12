import { http } from "viem";
import {
  publicKeyToAddress,
  privateKeyToAccount,
  privateKeyToAddress,
} from "viem/accounts";

import factory from "../ABI/UniswapV2Factory.sol/UniswapV2Factory.json" assert { type: "json" };
import pair from "../ABI/UniswapV2Pair.sol/UniswapV2Pair.json" assert { type: "json" };
import ERC20 from "../ABI/MockERC20.sol/MockERC20.json" assert { type: "json" };
import router from "../ABI/UniswapV2Router02.sol/UniswapV2Router02.json" assert { type: "json" };
import flashSwap from "../ABI/FlashSwapExample.sol/FlashSwapExample.json" assert { type: "json" };

import NetworkManager from "../../src/managers/NetworkManager.js";

function privateKeyToPublicKey(private_key) {
  // Düz string olarak verdiğimizde uygulama kabul etmiyor. Hex yapabilmemiz için `${private_key}` şeklinde kullanmamız yeterli.
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

let networks = () => {
  const ntw = {};

  NetworkManager.networks.forEach(({ name, url }) => {
    ntw[name] = {
      url,
      transport: http(url),
    };
  });

  return {
    ...ntw,
    custom: (url) => {
      return {
        url,
        transport: http(url),
      };
    },
  };
};

console.log(networks);

export {
  publicKeyToAddress,
  privateKeyToAccount,
  privateKeyToAddress,
  privateKeyToPublicKey,
  ABI,
  networks,
};
