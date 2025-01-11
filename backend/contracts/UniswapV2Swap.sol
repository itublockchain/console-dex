// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
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

contract UniswapV2SwapExamples {
    IUniswapV2Router public router;
    IWETH public weth;
    IERC20 public firstToken;

    constructor(address _router, address _weth) {
        router = IUniswapV2Router(_router);
        weth = IWETH(_weth);
    }

    function isWETH(address token) internal view returns (bool) {
        return token == address(weth);
    }

    function swapSingleHopExactAmountIn(
        uint256 amountIn,
        uint256 amountOutMin,
        address token0,
        address token1
    ) external returns (uint256 amountOut) {
        address[] memory path;
        path = new address[](2);


        if (isWETH(token0)) {
            firstToken = IWETH(token0);
        } else {
            firstToken = IERC20(token0);
        }
        firstToken.transferFrom(msg.sender, address(this), amountIn);
        firstToken.approve(address(router), amountIn);

        path[0] = token0;
        path[1] = token1;

        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn, amountOutMin, path, msg.sender, block.timestamp
        );

        return amounts[1];
    }

    function swapSingleHopExactAmountOut(
        address token0,
        address token1,
        uint256 amountOutDesired,
        uint256 amountInMax
    ) external returns (uint256 amountOut) {
        address[] memory path;
        path = new address[](2);

        if (isWETH(token0)) {
            weth.transferFrom(msg.sender, address(this), amountInMax);
            weth.approve(address(router), amountInMax);
        } else {
            firstToken = IERC20(token0);
            firstToken.transferFrom(msg.sender, address(this), amountInMax);
            firstToken.approve(address(router), amountInMax);
        }

        
        path[0] = token0;
        path[1] = token1;

        uint256[] memory amounts = router.swapTokensForExactTokens(
            amountOutDesired, amountInMax, path, msg.sender, block.timestamp
        );

        if (amounts[0] < amountInMax) {
            if (isWETH(token0)) {
                weth.transfer(msg.sender, amountInMax - amounts[0]);
            } else {
                firstToken.transfer(msg.sender, amountInMax - amounts[0]);
            }
        }

        return amounts[1];
    }
}
