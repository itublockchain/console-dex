import ERC20 from "./ERC20.js";

class ERC20Properties extends ERC20 {
  constructor(address) {
    super(address);
  }
}

export default async (address) => {
  const token = new ERC20Properties(address);
  token.__token_properties = await token.getProperties();

  return token;
};
