import { stringToHex } from "viem";
import {
  publicKeyToAddress,
  privateKeyToAccount,
  privateKeyToAddress,
} from "viem/accounts";

function privateKeyToPublicKey(private_key) {
  const account = privateKeyToAccount(`${private_key}`);
  return account.publicKey;
}

export {
  publicKeyToAddress,
  privateKeyToAccount,
  privateKeyToAddress,
  privateKeyToPublicKey,
};
