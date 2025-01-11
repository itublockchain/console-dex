// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract UniswapV2SwapExamples {

    constructor(address ROUTER){
        router = ROUTER;
    }

    // Swap tokens
    function swapSingleHopExactAmountIn(uint256 amountIn, uint256 amountOutMin,address token0, address token1)
        external
        returns (uint256 amountOut)
    {
        if(isWETH(token0)//isWETH(token1)){
            if(isWETH(token0)){
                firstToken = IWETH(token0);
                secondToken = IERC20(token1);
                firstToken.transferFrom(msg.sender, address(this), amountIn);
                firstToken.approve(address(router), amountIn);

            }
            else if(isWETH(token1)){
                firstToken = IWETH(token1);
                secondToken = IERC20(token0);
                firstToken.transferFrom(msg.sender, address(this), amountIn);
                firstToken.approve(address(router), amountIn);

            }
        }
        else{
            firstToken = IERC20(token0);
            secondToken = IERC20(token1);
            firstToken.transferFrom(msg.sender, address(this), amountIn);
            firstToken.approve(address(router), amountIn);
        }
            
            
        address[] memory path;
        path = new address[](2);
        path[0] = token0.address;
        path[1] = token1.address;

        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn, amountOutMin, path, msg.sender, block.timestamp
        );

        // amounts[0] = first token's amount, amounts[1] = second token's amount
        return amounts[1];
    }

   

    function swapSingleHopExactAmountOut(
        address token0,
        address token1,
        uint256 amountOutDesired,
        uint256 amountInMax
    ) external returns (uint256 amountOut) {
        weth.transferFrom(msg.sender, address(this), amountInMax);
        weth.approve(address(router), amountInMax);

        address[] memory path;
        path = new address[](2);
        path[0] = token0;
        path[1] = token1;

        uint256[] memory amounts = router.swapTokensForExactTokens(
            amountOutDesired, amountInMax, path, msg.sender, block.timestamp
        );

        // Refund WETH to msg.sender
        if (amounts[0] < amountInMax) {
            weth.transfer(msg.sender, amountInMax - amounts[0]);
        }

        return amounts[1];
    }

    interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}





