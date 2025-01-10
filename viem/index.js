import * as viem from "viem";

import { privateKeyToAccount } from "./utils/utils.js";

import fs from "fs";

import { ABI } from "./utils/utils.js";

const addresses_path = fs.realpathSync("./backend/addresses.json");
const address_file_data = () => fs.readFileSync(addresses_path, "utf-8");
const addresses = () => JSON.parse(address_file_data());

const { router } = addresses();
const account = privateKeyToAccount(
  "0x33450df0e53c4ec0b58ff8810f72bd9154a14ff69bbe1790671340ab39d78197"
);

const wallet_client = viem.createWalletClient({
  account: account,
  transport: viem.http("http://localhost:8545"),
});

console.log(wallet_client);

const router_contract = viem.getContract({
  address: `${router}`,
  abi: ABI.router,
  client: wallet_client,
});

await router_contract.write.addLiquidity([
  "0x3B20713Ac80ef6d28bA8F854BF077c4b591aF6a1",
  "0xECE93e9d4f898084C979D8A27893d0C7D97874BF",
  10,
  10,
  0,
  0,
  "0x3B20713Ac80ef6d28bA8F854BF077c4b591aF6a1",
  ,
]);
