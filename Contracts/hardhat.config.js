require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    viaIR: true
  },
  networks:{
    holesky: {
    url: "https://1rpc.io/holesky",
    accounts: [`0xd2fe688cd49e4d3fb2b2c79087e61da266413ce1b0aca83c56966d7eb0f3ef84`],
  },
  fuji: {
    url: "https://ava-testnet.public.blastapi.io/ext/bc/C/rpc",
    accounts: [
      `0x4f9735f7c9dee0276d481e301e6ea8b027f2a6c5cd03f6aca64bedc3e36229ea`,
    ],
  },
}
};
