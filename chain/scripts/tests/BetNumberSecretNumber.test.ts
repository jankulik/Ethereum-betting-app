import  { expect } from "chai";
import { ethers } from "hardhat";
import {expectThrowsAsync, toVMError, latestTimestamp, convertCourse, hashIt} from "./utils"
import Web3 from "web3"

describe("BetNumberSecretAnswer should", function () {

  async function setUpContract(){
    const StorageByHash = await ethers.getContractFactory("StorageByHash");
    const storageByHash = await StorageByHash.deploy();
    await storageByHash.deployed();

    const BetNumber = await ethers.getContractFactory("BetNumberSecretAnswer");
    const betNumber = await BetNumber.deploy(storageByHash.address);
    await betNumber.deployed();

    return betNumber;
  }

  it("be able to create bet and reveal number", async function () {
    const betNumber = await setUpContract();

    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.createBet(uuid, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const revealNumberTransaction = await betNumber.revealNumber(uuid, number)
    await revealNumberTransaction.wait()
  });

  it("tell that it is too soon", async function () {
    const betNumber = await setUpContract();

    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.createBet(uuid, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    const revealNumberTransaction = async ()=> betNumber.revealNumber(uuid, number)
    await expectThrowsAsync(revealNumberTransaction, toVMError("It is too soon, deadline was not reached."))
  });

  it("tell that it is too late to reveal", async function () {
    const betNumber = await setUpContract();

    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.createBet(uuid, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime*4]);
    await expectThrowsAsync(async () => betNumber.revealNumber(uuid, number), toVMError("It is too late."))
  });

  it("tell user that there is not enough money to pay him", async function () {
    const betNumber = await setUpContract();

    //createBet
    const uuid = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.createBet(uuid, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = 3;
    const betTransaction =  async () => betNumber.bet(uuid, guessNumber, {value: ethers.utils.parseEther("0.51")})
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
    const nonce = 12233
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.connect(owner).createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser).bet(betId, hashIt(guessNumber, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number)
    await revealNumberTransaction.wait()
    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const revealGuessTransaction = await betNumber.connect(guesser).revealGuess(betId, 0, guessNumber, nonce)
    await revealGuessTransaction.wait()

    expect(await betNumber.provider.getBalance(betNumber.address)/10000000000000000).to.be.equal(25);
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
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber1 = number;
    const betTransaction1 = await betNumber.connect(guesser1).bet(betId, hashIt(guessNumber1, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction1.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, hashIt(guessNumber2, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const revealGuess1Transaction = await betNumber.connect(guesser1).revealGuess(betId, 0, guessNumber1, nonce)
    await revealGuess1Transaction.wait()

    const revealGuess2Transaction = await betNumber.connect(guesser2).revealGuess(betId, 1, guessNumber2, nonce)
    await revealGuess2Transaction.wait()

    // const 

    expect(await betNumber.provider.getBalance(betNumber.address)/10000000000000000).to.be.equal(25);
    expect(Math.round((await betNumber.provider.getBalance(owner.address) - initialOwnerBalance)/ 10000000000000000)).to.be.equal(-25);
    expect(Math.round((await betNumber.provider.getBalance(guesser1.address) - initialGuesser1Balance)/10000000000000000)).to.be.equal(25);
    expect(Math.round((await betNumber.provider.getBalance(guesser2.address) - initialGuesser2Balance)/10000000000000000)).to.be.equal(-25);
  });


  it("Tell that it is too late to reveal number", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber1 = number;
    const betTransaction1 = await betNumber.connect(guesser1).bet(betId, hashIt(guessNumber1, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction1.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, hashIt(guessNumber2, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime*3]);    
    const revealNumberTransaction = async () => betNumber.connect(owner).revealNumber(betId, number)

    await expectThrowsAsync(revealNumberTransaction, toVMError("It is too late."));
  });

  it("Tell user that it is too late to claim the prize", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.connect(owner).createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber1 = number;
    const betTransaction1 = await betNumber.connect(guesser1).bet(betId, hashIt(guessNumber1, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction1.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, hashIt(guessNumber2, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*4]);
    const revealGuess1Transaction = async ()=> betNumber.connect(guesser1).revealGuess(betId, 0, guessNumber1, nonce)

    await expectThrowsAsync(revealGuess1Transaction, toVMError('It is already after prize claim deadline late.'))

  });

  it("not allow users to force finish bet", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber1 = number;
    const betTransaction1 = await betNumber.connect(guesser1).bet(betId, hashIt(guessNumber1, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction1.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, hashIt(guessNumber2, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const forceTransaction = async ()=> betNumber.connect(guesser1).forceFinishBet(betId)

    await expectThrowsAsync(forceTransaction, toVMError('It is too soon, answerRevealDeadline was not reached.'))

  });

  it("Allow users to force finish bet", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesser1Balance = await betNumber.provider.getBalance(guesser1.address);
    const initialGuesser2Balance = await betNumber.provider.getBalance(guesser2.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.connect(owner).createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber1 = number;
    const betTransaction1 = await betNumber.connect(guesser1).bet(betId, hashIt(guessNumber1, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction1.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, hashIt(guessNumber2, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();
    await ethers.provider.send('evm_increaseTime', [deltaTime*3]);
    const forceTransaction = await betNumber.connect(guesser1).forceFinishBet(betId)
    await forceTransaction.wait();

    expect(await betNumber.provider.getBalance(betNumber.address)/10000000000000000).to.be.equal(0);
    expect(Math.round((await betNumber.provider.getBalance(owner.address) - initialOwnerBalance)/ 10000000000000000)).to.be.equal(-50);
    expect(Math.round((await betNumber.provider.getBalance(guesser1.address) - initialGuesser1Balance)/10000000000000000)).to.be.equal(25);
    expect(Math.round((await betNumber.provider.getBalance(guesser2.address) - initialGuesser2Balance)/10000000000000000)).to.be.equal(25);
  });


  it("not allow to force finnish after answer reveal", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.connect(owner).createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber1 = number;
    const betTransaction1 = await betNumber.connect(guesser1).bet(betId, hashIt(guessNumber1, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction1.wait();
    
    const guessNumber2 = number+1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, hashIt(guessNumber2, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction2.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number)
    await revealNumberTransaction.wait()

    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const forceTransaction = async ()=> betNumber.connect(guesser1).forceFinishBet(betId)

    await expectThrowsAsync(forceTransaction, toVMError('It is too soon, prizeClaimDeadline was not reached.'))
  });


  it("allow to bet on option and reveal answer in option", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesser1Balance = await betNumber.provider.getBalance(guesser1.address);
    const initialGuesser2Balance = await betNumber.provider.getBalance(guesser2.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.connect(owner).createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[1,2,3], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber1 = number;
    const betTransaction1 = await betNumber.connect(guesser1).bet(betId, hashIt(guessNumber1, nonce), {value: ethers.utils.parseEther("0.2")})
    await betTransaction1.wait();
    
    const guessNumber2 = number-1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, hashIt(guessNumber2, nonce), {value: ethers.utils.parseEther("0.3")})
    await betTransaction2.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number)
    await revealNumberTransaction.wait()
    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const revealGuessTransaction1 = await betNumber.connect(guesser1).revealGuess(betId, 0, guessNumber1, nonce)
    await revealGuessTransaction1.wait()

    const revealGuessTransaction2 = await betNumber.connect(guesser2).revealGuess(betId, 1, guessNumber2, nonce)
    await revealGuessTransaction2.wait()

    expect(await betNumber.provider.getBalance(betNumber.address)/10000000000000000).to.be.equal(30);
    expect(Math.round((await betNumber.provider.getBalance(owner.address) - initialOwnerBalance)/ 10000000000000000)).to.be.equal(-20);
    expect(Math.round((await betNumber.provider.getBalance(guesser1.address) - initialGuesser1Balance)/10000000000000000)).to.be.equal(20);
    expect(Math.round((await betNumber.provider.getBalance(guesser2.address) - initialGuesser2Balance)/10000000000000000)).to.be.equal(-30);
  });



  it("punish owner for reveling an answer not in options", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser1, guesser2] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesser1Balance = await betNumber.provider.getBalance(guesser1.address);
    const initialGuesser2Balance = await betNumber.provider.getBalance(guesser2.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 3482348573857353;
    const deltaTime = 100;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.connect(owner).createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[1,2], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber1 = 2;
    const betTransaction1 = await betNumber.connect(guesser1).bet(betId, hashIt(guessNumber1, nonce), {value: ethers.utils.parseEther("0.2")})
    await betTransaction1.wait();
    
    const guessNumber2 = 1;
    const betTransaction2 = await betNumber.connect(guesser2).bet(betId, hashIt(guessNumber2, nonce), {value: ethers.utils.parseEther("0.3")})
    await betTransaction2.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);    
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number)
    await revealNumberTransaction.wait()

    expect(await betNumber.provider.getBalance(betNumber.address)/10000000000000000).to.be.equal(0);
    expect(Math.round((await betNumber.provider.getBalance(owner.address) - initialOwnerBalance)/ 10000000000000000)).to.be.equal(-50);
    expect(Math.round((await betNumber.provider.getBalance(guesser1.address) - initialGuesser1Balance)/10000000000000000)).to.be.equal(20);
    expect(Math.round((await betNumber.provider.getBalance(guesser2.address) - initialGuesser2Balance)/10000000000000000)).to.be.equal(30);
  });


  it("It should not accept a wrong guess reveal", async function () {
    const betNumber = await setUpContract();

    const [owner, guesser] = await ethers.getSigners();
    const initialOwnerBalance = await betNumber.provider.getBalance(owner.address);
    const initialGuesserBalance = await betNumber.provider.getBalance(guesser.address);
    //createBet
    const betId = "748cc940-5e1d-42ef-a390-987efd6e4c89"
    const number = 3;
    const nonce = 12233
    const deltaTime = 10;
    const deadline = await latestTimestamp()+deltaTime;
    const setValueTransaction = await betNumber.connect(owner).createBet(betId, "name", "desc", convertCourse(2), deadline, deadline+2*deltaTime, deadline+4*deltaTime, [],[],[], { value: ethers.utils.parseEther("0.5") });
    await setValueTransaction.wait();
    //guess
    const guessNumber = number;
    const betTransaction = await betNumber.connect(guesser).bet(betId, hashIt(guessNumber, nonce), {value: ethers.utils.parseEther("0.25")})
    await betTransaction.wait();

    await ethers.provider.send('evm_increaseTime', [deltaTime]);
    const revealNumberTransaction = await betNumber.connect(owner).revealNumber(betId, number)
    await revealNumberTransaction.wait()
    await ethers.provider.send('evm_increaseTime', [deltaTime*2]);
    const revealGuessTransaction = async ()=> betNumber.connect(guesser).revealGuess(betId, 0, guessNumber+1, nonce)

    await expectThrowsAsync(revealGuessTransaction, toVMError("Data hash is not correct original:"));
  });
});