// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Pool {

    //random names, they don't mean anything.
    IERC20 public token_Chikorita;
    IERC20 public token_Cynda;

    uint256 public poolBalance_Chikorita;
    uint256 public poolBalance_Cynda;

    uint256 public K;
    uint256 public constant TOLERANCE = 10**12;

    constructor(address _addressChikorita, address _addressCynda, uint256 _initialLiquidity)
    {
        require(_addressChikorita != address(0) && _addressCynda != address(0), "Invalid token address/address'");
        require(_initialLiquidity >= 100, "Make sure the initial liquidity is above 100.");

        token_Chikorita = IERC20(_addressChikorita);
        token_Cynda = IERC20(_addressCynda);

        //the deployer supplies the first _initialLiquidity pair for the pool. >= 100 is required for _initialLiquidity.
        require(token_Chikorita.allowance(msg.sender, address(this)) >= _initialLiquidity, "Insufficient allowance for Chikorita");
        require(token_Cynda.allowance(msg.sender, address(this)) >= _initialLiquidity, "Insufficient allowance for Cynda");
        require(token_Chikorita.transferFrom(msg.sender, address(this), _initialLiquidity), "Chikorita transfer failed");
        require(token_Cynda.transferFrom(msg.sender, address(this), _initialLiquidity), "Cynda transfer failed");

        //update pool balances.
        poolBalance_Chikorita = _initialLiquidity;
        poolBalance_Cynda = _initialLiquidity;

        //calculate initial value of K
        K = poolBalance_Chikorita * poolBalance_Cynda;
    }

    function addLiquidity(uint256 _amountChikorita, uint256 _amountCynda) external {
        require(_amountChikorita > 0 && _amountCynda > 0, "Liquidity amounts must be greater than zero");

        //calculate the expected amount for the other token.
        uint256 expectedCyndaAmount = (_amountChikorita + poolBalance_Chikorita) * poolBalance_Cynda / poolBalance_Chikorita;

        //ternary operator because solidity doesn't have a builtin abs() function.
        uint256 diff = (expectedCyndaAmount >= _amountCynda)
            ? (expectedCyndaAmount - _amountCynda)
            : (_amountCynda - expectedCyndaAmount);
        require(diff <= TOLERANCE, "Token ratio of the pool not respected. (ABOVE TOLERANCE)");

        //send the tokens to the pool, after conforming that user has enough tokens.
        require(token_Chikorita.transferFrom(msg.sender, address(this), _amountChikorita), "Chikorita transfer failed");
        require(token_Cynda.transferFrom(msg.sender, address(this), _amountCynda), "Cynda transfer failed");

        //update pool balances
        poolBalance_Chikorita += _amountChikorita;
        poolBalance_Cynda += _amountCynda;

        //calculate the new K constant.
        K = poolBalance_Chikorita * poolBalance_Cynda;
    }

    function removeLiquidity() external {
        return;
    }

    function swap() external {
        return;
    }

    function showPoolBalance() public view returns (uint256, uint256) {
        return (poolBalance_Chikorita, poolBalance_Cynda);
    }
}