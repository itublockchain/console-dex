import { http } from "viem";
import {
  publicKeyToAddress,
  privateKeyToAccount,
  privateKeyToAddress,
} from "viem/accounts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON dosyalarını oku
const factory = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../ABI/UniswapV2Factory.sol/UniswapV2Factory.json")
  )
);
const pair = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../ABI/UniswapV2Pair.sol/UniswapV2Pair.json")
  )
);
const ERC20 = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../ABI/MockERC20.sol/MockERC20.json"))
);
const router = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../ABI/UniswapV2Router02.sol/UniswapV2Router02.json")
  )
);
const swap = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../ABI/UniswapV2Swap.sol/UniswapV2SwapExamples.json")
  )
);

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
  swap: swap.abi,
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

networks();

export {
  publicKeyToAddress,
  privateKeyToAccount,
  privateKeyToAddress,
  privateKeyToPublicKey,
  ABI,
  networks,
};
