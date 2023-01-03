// Right click on the script name and hit "Run" to execute
import  { expect } from "chai";
import { ethers } from "hardhat";
import {expectThrowsAsync} from "./utils"
import web3 from "web3"



describe("StorageByHash", function () {
  it("be able to submit data", async function () {
    const StorageByHash = await ethers.getContractFactory("StorageByHash");
    const storageByHash = await StorageByHash.deploy();
    await storageByHash.deployed();

    const uuid = "26b6a7db-3eb7-4ab7-9afe-8cfab34ee7e7"
    const valueToStore = web3.utils.asciiToHex('hello')
    const localHash = web3.utils.soliditySha3(valueToStore);
    const setValueTransaction = await storageByHash['storeHash(string,uint256)'](uuid,localHash);
    await setValueTransaction.wait();
    const uploadDataTransaction = await storageByHash.uploadData(uuid, valueToStore)
    await uploadDataTransaction.wait()
    expect((await storageByHash.storedItems(uuid))[3]).to.equal(valueToStore)
  });
  it("not allow to override hash", async function () {
    const StorageByHash = await ethers.getContractFactory("StorageByHash");
    const storageByHash = await StorageByHash.deploy();
    await storageByHash.deployed();

    const uuid = "26b6a7db-3eb7-4ab7-9afe-8cfab34ee7e7"
    const valueToStore1 = web3.utils.asciiToHex('hello')
    const localHash1 = web3.utils.soliditySha3(valueToStore1);
    const setValueTransaction = await storageByHash['storeHash(string,uint256)'](uuid,localHash1);
    await setValueTransaction.wait();

    const valueToStore2 = web3.utils.asciiToHex('hallo')
    const localHash2 = web3.utils.soliditySha3(valueToStore2);
    const overrideTransaction =  async () =>storageByHash['storeHash(string,uint256)'](uuid,localHash2);
    expectThrowsAsync(overrideTransaction, "Error: Error from IDE : revert You shall not pass!")
  });
});