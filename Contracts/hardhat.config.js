require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    viaIR: true,
  },
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [
        `0x4f9735f7c9dee0276d481e301e6ea8b027f2a6c5cd03f6aca64bedc3e36229ea`,
      ],
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
    },
  },
  // Hardhat local node mimicking Ganache
  hardhat: {
    chainId: 1337,
    mining: {
      auto: true,
      interval: 0,
    },
  },
};
