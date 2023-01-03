import  { expect } from "chai";
import { ethers} from "hardhat";
import Web3 from "web3"


export const expectThrowsAsync = async (method, errorMessage) => {
    let error = null
    try {
      await method()
    }
    catch (err) {
      error = err
    }
    expect(error).to.be.an('Error')
    if (errorMessage) {
      expect((<any>error!).message).to.equal(errorMessage)
    }
  }

export const sleep = (timeout) => new Promise((resolve, reject) => setTimeout(resolve, timeout));

export const toVMError = (error) => `VM Exception while processing transaction: reverted with reason string '${error}'`

export const latestTimestamp = async () => {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore.timestamp;
}

export const convertCourse = async (course:number) => {
  return ethers.utils.parseUnits(course.toString(), 17)
}


export const hashIt =(number, nonce) => {
  const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
  return  Web3.utils.soliditySha3(valueToStore);
}