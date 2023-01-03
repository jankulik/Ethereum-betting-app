import { task, HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import { removeConsoleLog } from "hardhat-preprocessor";
import "hardhat-deploy";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await (hre as any).ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  paths: {
    sources: "./chain/contracts",
    tests: "./chain/scripts/tests",
    artifacts: "./chain/contracts/artifacts",
    cache: "./build/cache",
    deploy: "./chain/scripts/deploy",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 20000,
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    showMethodSig: true,
    onlyCalledMethods: false,
  },
  preprocess: {
    eachLine: removeConsoleLog(
      (hre) =>
        hre.network.name !== "hardhat" && hre.network.name !== "localhost"
    ),
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      rinkeby: "0x5238A644636946963ffeDAc52Ec53fb489D3a1CD", // on rinkeby, use a specific account
    },
  },
};

export default config;
