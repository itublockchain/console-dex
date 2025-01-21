const { ethers } = require("hardhat");

async function getReserves(factory, tokenA, tokenB) {
    // Get the pair address
    const pairAddress = await factory.getPair(tokenA, tokenB);
    if (pairAddress === ethers.ZeroAddress) {
        return [0n, 0n];
    }
    
    // Get the pair contract
    const pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);
    const [reserve0, reserve1] = await pair.getReserves();
    
    // Return reserves in the same order as input tokens
    return tokenA < tokenB ? [reserve0, reserve1] : [reserve1, reserve0];
}

async function getAmountOut(amountIn, reserveIn, reserveOut) {
    if (reserveIn === 0n || reserveOut === 0n) {
        throw new Error("INSUFFICIENT_LIQUIDITY");
    }
    
    const amountInWithFee = amountIn * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = (reserveIn * 1000n) + amountInWithFee;
    return numerator / denominator;
}

async function getAmountIn(amountOut, reserveIn, reserveOut) {
    if (reserveIn === 0n || reserveOut === 0n) {
        throw new Error("INSUFFICIENT_LIQUIDITY");
    }
    
    const numerator = reserveIn * amountOut * 1000n;
    const denominator = (reserveOut - amountOut) * 997n;
    return (numerator / denominator) + 1n;
}

async function getAmountsOut(factory, amountIn, path) {
    const amounts = [amountIn];
    
    for (let i = 0; i < path.length - 1; i++) {
        const [reserveIn, reserveOut] = await getReserves(
            factory,
            path[i],
            path[i + 1]
        );
        amounts.push(await getAmountOut(amounts[i], reserveIn, reserveOut));
    }
    
    return amounts;
}

async function getAmountsIn(factory, amountOut, path) {
    const amounts = new Array(path.length);
    amounts[amounts.length - 1] = amountOut;
    
    for (let i = path.length - 1; i > 0; i--) {
        const [reserveIn, reserveOut] = await getReserves(
            factory,
            path[i - 1],
            path[i]
        );
        amounts[i - 1] = await getAmountIn(amounts[i], reserveIn, reserveOut);
    }
    
    return amounts;
}

module.exports = {
    getReserves,
    getAmountOut,
    getAmountIn,
    getAmountsOut,
    getAmountsIn
};
