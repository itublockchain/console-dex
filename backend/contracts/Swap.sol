// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract Swap {
    address public immutable router;
    address public immutable WETH;

    constructor(address _router, address _WETH) {
        router = _router;
        WETH = _WETH;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        // Transfer tokens from sender to this contract
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        // Approve router to spend tokens
        IERC20(path[0]).approve(router, amountIn);
        
        // Execute swap
        return IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        // Calculate required input amount
        uint[] memory amounts = IUniswapV2Router02(router).getAmountsIn(amountOut, path);
        uint amountIn = amounts[0];
        
        require(amountIn <= amountInMax, "Excessive input amount");
        
        // Transfer tokens from sender to this contract
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        // Approve router to spend tokens
        IERC20(path[0]).approve(router, amountIn);
        
        // Execute swap
        return IUniswapV2Router02(router).swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );
    }
}
