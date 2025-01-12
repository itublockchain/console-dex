// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./pool.sol";

contract PoolFactory {
    // Struct to store pool information
    struct PoolInfo {
        address poolAddress;
        address tokenChikorita;
        address tokenCynda;
    }

    // Array to store all created pools
    PoolInfo[] public pools;

    function createPool(
        address _addressChikorita,
        address _addressCynda,
        uint256 _initialLiquidity
    ) external {
        Pool newPool = new Pool(_addressChikorita, _addressCynda, _initialLiquidity);

        // Add the new pool to the array
        pools.push(PoolInfo({
            poolAddress: address(newPool),
            tokenChikorita: _addressChikorita,
            tokenCynda: _addressCynda
        }));

    }

    // Function to get the total number of pools created
    function getPoolCount() external view returns (uint256) {
        return pools.length;
    }

    // Function to retrieve all pools
    function getAllPools() external view returns (PoolInfo[] memory) {
        return pools;
    }
}
