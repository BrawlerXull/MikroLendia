const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MikroLendiaDeployment", (m) => {
  // Deploy UserContract
  const userContract = m.contract("UserContract", []);

  // Deploy LoanContract with UserContract address
  const loanContract = m.contract("LoanContract", [userContract]);

  // Deploy Community (implementation)
  const community = m.contract("Community", []);

  // Deploy CommunityFactory with Community implementation address
  const communityFactory = m.contract("CommunityFactory", [community]);

  return { userContract, loanContract, community, communityFactory };
});
