//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./StorageByHash.sol";
import "./BetBase.sol";



/**
As we understood that forceFinishBet function might be non exucutable if there were a lot of guesses. It was too late to rewrite the frontend so we just created another class that allows user to claim prizes individually.
 */
contract BetNumberNoForceFinish is BetBase{

    constructor(address storageContractAddress) BetBase(storageContractAddress){
    }


    /**
    Creates bet without storing encrypted answer
     */
    function createBet(string calldata id, string memory name, string memory description, uint256 hash, uint256 course, uint256 bettingDeadline, uint256 answerRevealDeadline, uint256 prizeClaimDeadline, address[] memory whitelist, address[] memory blacklist, int256[] memory restrictedOptions) payable public{
        require(bettingDeadline >= block.timestamp, "deadline already passed");
        require(answerRevealDeadline >= bettingDeadline);
        require(course > 100000000000000000, "Your course needs to be higher than 1e17");
        storageByHash.storeHash(id, hash);
        
        _createDeadlines(id, bettingDeadline, answerRevealDeadline, prizeClaimDeadline);
        _createBet(id, name, description, payable(msg.sender), msg.value, course, whitelist, blacklist, restrictedOptions);
    }

    /**
    Allows user to bet on a given Bet.
     */
    function bet(string calldata betId, int256 guess) payable public minValue() betExists(betId) betOpen(betId) isWhitelisted(betId) notBlacklisted(betId) returns (Guess memory){
        Bet storage selectedBet = storedBets[betId];
        require(msg.sender != selectedBet.owner, "You cannot bet on your own Bet.");
        require(multMoney((selectedBet.totalBets + msg.value),decreaseCourse(selectedBet.course)) <= selectedBet.betLimit, "There is not enough money in a vault to pay you if you win. The most you can bet is");

        uint256 newId = selectedBet.guesses.length;
        Guess memory newGuess = Guess(newId, payable(msg.sender), msg.value, false, guess, 0);
        if(!selectedBet.optionExists[guess]){
            require(!selectedBet.hasRestrictedOptions, "Betting is restricted to only given options.");
        }
        _updateOptions(selectedBet, newGuess);
        selectedBet.totalBets += msg.value;
        selectedBet.guesses.push(newGuess);
        userGuesses[msg.sender].push(UserGuess(newGuess.id, betId));
        return newGuess;
    }

    /**
    Allows user to reveal the answer
    */
    function revealNumber(string calldata betId, int256 revealedNumber, int256 nonce) public nonReentrant() betExists(betId) isInAnswerRevealPeriod(betId) betOwner(betId) statusRunning(betId){
        Bet storage selectedBet = storedBets[betId];
        
        storageByHash.uploadData(betId, valueToBinary(revealedNumber, nonce));//storage takes care of checking if value is correct
        selectedBet.answer = revealedNumber;
        selectedBet.nonce = nonce;
        selectedBet.status = Status.ANSWER_REVEALED;
    }

    /**
    Allows user to claim prize after answer is revealed.
     */
    function claimPrize(string memory betId, uint256 guessId) public nonReentrant() betExists(betId) isInPrizeClaimPeriod(betId) guessOwner(betId, guessId) guessNotEvaluated(betId, guessId){
        Bet storage selectedBet = storedBets[betId];
        Guess storage selectedGuess = selectedBet.guesses[guessId];
        require(selectedBet.status <= Status.ANSWER_REVEALED, "Bet is no longer open");
        if(selectedBet.answer == selectedGuess.guess || (selectedBet.status == Status.RUNNING) ||(selectedBet.hasRestrictedOptions && !selectedBet.optionExists[selectedBet.answer])){
            payable(selectedGuess.bettor).transfer(multMoney(selectedGuess.amount,selectedBet.course));
            selectedBet.betLimit -= multMoney(selectedGuess.amount,decreaseCourse(selectedBet.course));
            selectedBet.totalBets -= selectedGuess.amount;
        }
        selectedGuess.evaluated = true;
    }


    /**
    Allows user to finish bet and send remaining money to owner.
    */
    function finishBet(string memory betId) nonReentrant() betExists(betId) public {// We do not require status Answer revealed, cause user coould not have revealed it
        Bet storage selectedBet = storedBets[betId];
        require(block.timestamp > selectedBet.prizeClaimDeadline, "It is too soon, prizeClaimDeadline was not reached.");
        payable(selectedBet.owner).transfer(selectedBet.betLimit+selectedBet.totalBets);
        selectedBet.status = Status.FINNISHED;
    }
}

