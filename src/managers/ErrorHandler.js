import chalk from "chalk";

class ErrorHandler {
  constructor() {
    this.defaultError = Error("No Error");
    this.error = this.defaultError;
    this.shadow = true;
  }

  setError(error) {
    this.error = error;
    this.setErrorMessage(error);

    this.shadow = false;
  }

  setErrorMessage() {
    let error_message;
    switch (this.error.name) {
      case "InvalidAddressError":
        error_message = "Invalid contract address provided.";
        break;
      case "SyntaxError":
        // Will be implemented.
        error_message = "Number must be integer not float.";
        break;
      case "WalletPrivateKeyError":
        error_message = `Invalid private key! Example: "${chalk.white(
          "0xfkd9fkprivatekeycx9sc9..."
        )}"`;
        break;
      case "PrivateKeyAlreadyExists":
        error_message = "This private key already exists.";
        break;
      case "HTTPRequestError":
        error_message = "HTTP request failed. RPC url may be broken.";
        break;
      default:
        error_message = "No error message configured.";
    }

    this.error.message = error_message;
  }

  deleteError() {
    this.error = this.defaultError;
    this.shadow = true;
  }
}

export default new ErrorHandler();
