// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract viewHelper {
    function viewUserBalance(address token, address user) public view returns (uint256) {
        IERC20 erc20 = IERC20(token);
        return erc20.balanceOf(user);
    }

    function viewPool() public view {
        return;
    }

    function viewUserAddresses() public view {
        //I don't really know what this is supposed to be
        //Maybe I can go through every address and return a list of ones that has > 0 token
        return;
    }
}