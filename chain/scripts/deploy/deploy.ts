import { ethers } from "hardhat";
import fs from "fs"

function readFile(path){
  let rawdata = fs.readFileSync(path);
  return JSON.parse(rawdata as any);
}

function saveFile(path, data){
  let rawdata = JSON.stringify(data,null, 4)
  fs.writeFileSync(path, rawdata)
}

function loadABI(contractName){
  return readFile(`chain/contracts/artifacts/chain/contracts/${contractName}.sol/${contractName}.json`).abi
}

async function deployFunc() {
  console.log("Deploying Storage By hash")
  const StorageByHash = await ethers.getContractFactory("chain/contracts/StorageByHash.sol:StorageByHash");
  const storageByHash = await StorageByHash.deploy();
  await storageByHash.deployed();

  console.log(`StorageByApp deployed on ${storageByHash.address}`)
  
  console.log("Deploying betNumber")
  const BetNumber = await ethers.getContractFactory("chain/contracts/BetNumber.sol:BetNumber");
  const betNumber = await BetNumber.deploy(storageByHash.address);
  await betNumber.deployed();

  console.log(`BetNumber deployed on ${betNumber.address}`)

  console.log("Deploying BetNumberSecretAnswer")
  const BetNumberSecretAnswer = await ethers.getContractFactory("chain/contracts/BetNumberSecretAnswer.sol:BetNumberSecretAnswer");
  const betNumberSecretAnswer = await BetNumberSecretAnswer.deploy(storageByHash.address);
  await betNumberSecretAnswer.deployed();

  console.log(`BetNumber deployed on ${betNumberSecretAnswer.address}`)

  console.log("Deploying betMarket")
  const BetMarket = await ethers.getContractFactory("chain/contracts/BetMarket.sol:BetMarket");
  const betMarket = await BetMarket.deploy();
  await betMarket.deployed();

  console.log(`BetMarket deployed on ${betMarket.address}`)

  console.log("Loading contract")
  const betNumberAbi = loadABI("BetNumber")
  const betNumberSecretAnswerAbi = loadABI("BetNumberSecretAnswer")
  const betMarketAbi = loadABI("BetMarket")

  const betNumberContractsData = {
      "address": betNumber.address,
      "abi": betNumberAbi
  }

  const betNumberSecretAnswerData = {
    "address": betNumberSecretAnswer.address,
    "abi": betNumberSecretAnswerAbi
  }

  const betMarketContractsData = {
    "address": betMarket.address,
    "abi": betMarketAbi
}

  var webAppFile = readFile("webapp/contracts.json");

  webAppFile.BetNumber = betNumberContractsData;
  webAppFile.BetNumberSecretAnswer = betNumberSecretAnswerData;
  webAppFile.BetMarket = betMarketContractsData;

  saveFile("webapp/contracts.json", webAppFile);

}

module.exports.default = deployFunc