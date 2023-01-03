import  { expect } from "chai";
import { ethers } from "hardhat";
import {expectThrowsAsync, toVMError, latestTimestamp, convertCourse} from "./utils"
import Web3 from "web3"

describe("BetNumberNoForceFinish should", function () {

  async function setUpContract(){
    const StorageByHash = await ethers.getContractFactory("StorageByHash");
    const storageByHash = await StorageByHash.deploy();
    await storageByHash.deployed();

    const BetNumber = await ethers.getContractFactory("BetNumberNoForceFinish");
    const betNumber = await BetNumber.deploy(storageByHash.address);
    await betNumber.deployed();

    return betNumber;
  }

  it("be able to create bet and reveal number", async function () {
    const betNumber = await setUpContract();

    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](uuid, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const revealNumberTransaction = await betNumber.revealNumber(uuid, number, nonce)
    await revealNumberTransaction.wait()
  });

  it("tell that it is too soon", async function () {
    const betNumber = await setUpContract();

    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](uuid, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    const revealNumberTransaction = async ()=> betNumber.revealNumber(uuid, number, nonce)
    await expectThrowsAsync(revealNumberTransaction, toVMError("It is too soon, deadline was not reached."))
  });

  it("tell that it is too late to reveal", async function () {
    const betNumber = await setUpContract();

    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](uuid, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime*4]);
    await expectThrowsAsync(async () => betNumber.revealNumber(uuid, number, nonce), toVMError("It is too late."))
  });

  it("not accept wrong number", async function () {
    const betNumber = await setUpContract();

    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](uuid, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const revealNumberTransaction = async () => betNumber.revealNumber(uuid, number+1, nonce)
    await expectThrowsAsync(revealNumberTransaction, toVMError("Data hash is not correct original:"))
  });

  it("tell user that he cannot bet on his bet", async function () {
    const betNumber = await setUpContract();

    //createBet
    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](uuid, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = 3;
    const betTransaction =  async () => betNumber.bet(uuid, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await expectThrowsAsync(betTransaction, toVMError("You cannot bet on your own Bet."))
  });

  it("tell user that there is not enough money to pay him", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser] = await ethers.getSigners();
    //createBet
    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](uuid, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    // await ethers.provider.send('evm_increaseTime', [deltaTime]);
    //guess
    const guessNumber = 3;
    const betTransaction =  async () => betNumber.connect(guesser).bet(uuid, guessNumber, {value: ethers.utils.parseEther("0.51")})
    await expectThrowsAsync(betTransaction, toVMError("There is not enough money in a vault to pay you if you win. The most you can bet is"))
  });

  
  it("give user proper amount of money", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesserBalance = await betNumber.provider.getBalance(guesser.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const claimTransaction = await betNumber.connect(guesser).claimPrize(betId, 0);
    await claimTransaction.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const finishTransaction = await betNumber.connect(owner).finishBet(betId);
    await finishTransaction.wait();

    expect(await betNumber.provider.getBalance(betNumber.address)).to.be.equal(0);
    expect(Math.round(((<number><unknown>await betNumber.provider.getBalance(owner.address)) - <number><unknown>initialOwnerBalance)/ 10000000000000000)).to.be.equal(-25);
    expect(Math.round((<number><unknown>await betNumber.provider.getBalance(guesser.address) - <number><unknown>initialGuesserBalance)/10000000000000000)).to.be.equal(25);
  });

  it("give user proper amount of money 0.25", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesserBalance = await betNumber.provider.getBalance(guesser.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.25") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const claimTransaction = await betNumber.connect(guesser).claimPrize(betId, 0);
    await claimTransaction.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const finishTransaction = await betNumber.connect(owner).finishBet(betId);
    await finishTransaction.wait();

    expect(await betNumber.provider.getBalance(betNumber.address)).to.be.equal(0);
    expect(Math.round(((<number><unknown>await betNumber.provider.getBalance(owner.address)) - <number><unknown>initialOwnerBalance)/ 10000000000000000)).to.be.equal(-25);
    expect(Math.round((<number><unknown>await betNumber.provider.getBalance(guesser.address) - <number><unknown>initialGuesserBalance)/10000000000000000)).to.be.equal(25);
  });


  it("give users proper amount of money", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesser1Balance = await betNumber.provider.getBalance(guesser1.address);
    const initialGuesser2Balance = await betNumber.provider.getBalance(guesser2.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser1).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, guessNumber2, {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const claimTransaction1 = await betNumber.connect(guesser1).claimPrize(betId, 0);
    await claimTransaction1.wait();

    const claimTransaction2 = await betNumber.connect(guesser2).claimPrize(betId, 1);
    await claimTransaction2.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const finishTransaction = await betNumber.connect(owner).finishBet(betId);
    await finishTransaction.wait();

    expect(await betNumber.provider.getBalance(betNumber.address)).to.be.equal(0);
    expect(Math.round((await betNumber.provider.getBalance(owner.address) - initialOwnerBalance)/ 10000000000000000)).to.be.equal(0);
    expect(Math.round((await betNumber.provider.getBalance(guesser1.address) - initialGuesser1Balance)/10000000000000000)).to.be.equal(25);
    expect(Math.round((await betNumber.provider.getBalance(guesser2.address) - initialGuesser2Balance)/10000000000000000)).to.be.equal(-25);
  });

  it("Tell that it is too late to claim prize", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser1).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, guessNumber2, {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*3]);    
    

    const claimTransaction1 = async ()=> betNumber.connect(guesser1).claimPrize(betId, 0);

    expectThrowsAsync(claimTransaction1, toVMError("It is too late."))
  });


  it("Allow users to claim prize when owner not revealed", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesser1Balance = await betNumber.provider.getBalance(guesser1.address);
    const initialGuesser2Balance = await betNumber.provider.getBalance(guesser2.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser1).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, guessNumber2, {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    // const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce)
    // await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const claimTransaction1 = await betNumber.connect(guesser1).claimPrize(betId, 0);
    await claimTransaction1.wait();

    const claimTransaction2 = await betNumber.connect(guesser2).claimPrize(betId, 1);
    await claimTransaction2.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const finishTransaction = await betNumber.connect(owner).finishBet(betId);
    await finishTransaction.wait();


    expect(await betNumber.provider.getBalance(betNumber.address)).to.be.equal(0);
    expect(Math.round((await betNumber.provider.getBalance(owner.address) - initialOwnerBalance)/ 10000000000000000)).to.be.equal(-50);
    expect(Math.round((await betNumber.provider.getBalance(guesser1.address) - initialGuesser1Balance)/10000000000000000)).to.be.equal(25);
    expect(Math.round((await betNumber.provider.getBalance(guesser2.address) - initialGuesser2Balance)/10000000000000000)).to.be.equal(25);
  });


  it("Allow plaer to collect not claimed prices", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesser1Balance = await betNumber.provider.getBalance(guesser1.address);
    const initialGuesser2Balance = await betNumber.provider.getBalance(guesser2.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser1).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, guessNumber2, {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    
    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const finishTransaction = await betNumber.connect(owner).finishBet(betId);
    await finishTransaction.wait();

    expect(await betNumber.provider.getBalance(betNumber.address)).to.be.equal(0);
    expect(Math.round((await betNumber.provider.getBalance(owner.address) - initialOwnerBalance)/ 10000000000000000)).to.be.equal(50);
    expect(Math.round((await betNumber.provider.getBalance(guesser1.address) - initialGuesser1Balance)/10000000000000000)).to.be.equal(-25);
    expect(Math.round((await betNumber.provider.getBalance(guesser2.address) - initialGuesser2Balance)/10000000000000000)).to.be.equal(-25);
  });


  it("not allow to claim prize", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();

    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser1).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, guessNumber2, {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const claimTransaction1 = await betNumber.connect(guesser1).claimPrize(betId, 0);
    await claimTransaction1.wait();

    const claimTransaction2 = await betNumber.connect(guesser2).claimPrize(betId, 1);
    await claimTransaction2.wait();

    const claimTransaction22 = async() => await betNumber.connect(guesser2).claimPrize(betId, 1);

    await expectThrowsAsync(claimTransaction22, toVMError("Gues was already evaluated"))
  });

  it("allow to bet on an option and reveal answer with number in options", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesserBalance = await betNumber.provider.getBalance(guesser.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[1,2,3], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const claimTransaction1 = await betNumber.connect(guesser).claimPrize(betId, 0);
    await claimTransaction1.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const finishTransaction = await betNumber.connect(owner).finishBet(betId);
    await finishTransaction.wait();

    expect(await betNumber.provider.getBalance(betNumber.address)).to.be.equal(0);
    expect(Math.round(((<number><unknown>await betNumber.provider.getBalance(owner.address)) - <number><unknown>initialOwnerBalance)/ 10000000000000000)).to.be.equal(-25);
    expect(Math.round((<number><unknown>await betNumber.provider.getBalance(guesser.address) - <number><unknown>initialGuesserBalance)/10000000000000000)).to.be.equal(25);
  });

  it("Not allow users to bet on non included options", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser] = await ethers.getSigners();
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[1,2], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = async () => betNumber.connect(guesser).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})

    await expectThrowsAsync(betTransaction, toVMError("Betting is restricted to only given options."))
  });


  it.only("Pay back all the users after creator revelaed a number not in options", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesserBalance = await betNumber.provider.getBalance(guesser.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const valueToStore = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [number, nonce]);
    const localHash = Web3.utils.soliditySha3(valueToStore);
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber['createBet(string,string,string,uint256,uint256,uint256,uint256,uint256,address[],address[],int256[])'](betId, "name", "desc", localHash, convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[1,2], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = 2;
    const betTransaction = await betNumber.connect(guesser).bet(betId, guessNumber, {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number, nonce);
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const claimTransaction1 = await betNumber.connect(guesser).claimPrize(betId, 0);
    await claimTransaction1.wait();


    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const finishTransaction = await betNumber.connect(owner).finishBet(betId);
    await finishTransaction.wait();

    expect(await betNumber.provider.getBalance(betNumber.address)).to.be.equal(0);
    expect(Math.round(((<number><unknown>await betNumber.provider.getBalance(owner.address)) - <number><unknown>initialOwnerBalance)/ 10000000000000000)).to.be.equal(-25);
    expect(Math.round((<number><unknown>await betNumber.provider.getBalance(guesser.address) - <number><unknown>initialGuesserBalance)/10000000000000000)).to.be.equal(25);
  });
});