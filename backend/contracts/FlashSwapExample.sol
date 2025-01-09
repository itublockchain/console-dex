// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Callee.sol";

contract FlashSwapExample is IUniswapV2Callee {
    address public immutable pair;
    address public immutable token0;
    address public immutable token1;

    constructor(address _pair) {
        pair = _pair;
        token0 = IUniswapV2Pair(_pair).token0();
        token1 = IUniswapV2Pair(_pair).token1();
    }

    function startFlashSwap(uint amount0Out, uint amount1Out) external {
        IUniswapV2Pair(pair).swap(
            amount0Out,
            amount1Out,
            address(this),
            abi.encode(msg.sender)
        );
    }

    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata /* data */
    ) external override {
        require(msg.sender == pair, "Caller must be pair");
        require(sender == address(this), "Sender must be this contract");

        // Repay the flash swap with fee
        if (amount0 > 0) {
            uint fee = (amount0 * 3) / 997 + 1;
            IERC20(token0).transfer(pair, amount0 + fee);
        }
        if (amount1 > 0) {
            uint fee = (amount1 * 3) / 997 + 1;
            IERC20(token1).transfer(pair, amount1 + fee);
        }
    }
}