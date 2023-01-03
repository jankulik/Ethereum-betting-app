//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./StorageByHash.sol";
import "./BetBase.sol";


contract BetNumberSecretAnswer is BetBase {

    constructor(address storageContractAddress) BetBase(storageContractAddress){
    }

    /**
    Function to create a bet
     */
    function createBet(string calldata id, string memory name, string memory description, uint256 course, uint256 bettingDeadline, uint256 answerRevealDeadline, uint256 prizeClaimDeadline, address[] memory whitelist, address[] memory blacklist, int256[] memory restrictedOptions) payable public {
        require(bettingDeadline >= block.timestamp, "Deadline already passed");
        require(answerRevealDeadline >= bettingDeadline);
        require(prizeClaimDeadline > answerRevealDeadline);

        _createDeadlines(id, bettingDeadline, answerRevealDeadline, prizeClaimDeadline);
        _createBet(id, name, description, payable(msg.sender), msg.value, course, whitelist, blacklist, restrictedOptions);
    }

    /**
    Bet on a bet and save encryptrd answer
     */
    function encryptedBet(string calldata betId, uint256 guessHash, bytes memory encryptedGuess) payable public nonReentrant() minValue() betExists(betId) betOpen(betId) isWhitelisted(betId) notBlacklisted(betId) returns (Guess memory){
        Bet storage selectedBet = storedBets[betId];
        require(multMoney((selectedBet.totalBets + msg.value),decreaseCourse(selectedBet.course)) <= selectedBet.betLimit, "There is not enough money in a vault to pay you if you win. The most you can bet is");

        selectedBet.totalBets += msg.value;
        uint256 newId = selectedBet.guesses.length;
        string memory guessStorageId = string.concat(betId, Strings.toString(newId));
        storageByHash.storeHash(guessStorageId, guessHash, encryptedGuess);
        Guess memory newGuess = Guess(newId, payable(msg.sender), msg.value, false, 0, 0);
        selectedBet.guesses.push(newGuess);
        userGuesses[msg.sender].push(UserGuess(newGuess.id, betId));
        return newGuess;
    }

    /**
    Bet on a bet
     */
    function bet(string calldata betId, uint256 guessHash) payable public returns (Guess memory){
        return encryptedBet(betId, guessHash, '');
    }

    /**
    Reveal bet's answer
     */
    function revealNumber(string calldata betId, int256 revealedNumber) public nonReentrant() betExists(betId) statusRunning(betId) isInAnswerRevealPeriod(betId){
        Bet storage selectedBet = storedBets[betId];
        selectedBet.answer = revealedNumber;
        if(selectedBet.hasRestrictedOptions && !selectedBet.optionExists[revealedNumber]){
            return _forceFinishBet(selectedBet);
        }
        selectedBet.status = Status.ANSWER_REVEALED;
    }

    /**
    Reveal users previously submited guess after answer is revealed
     */
    function revealGuess(string calldata betId, uint256 guessId, int256 guessedNumber, int256 nonce) public nonReentrant() betExists(betId) guessOwner(betId, guessId) statusAnswerRewealed(betId)  isInPrizeClaimPeriod(betId){
        Bet storage selectedBet = storedBets[betId];

        string memory guessStorageId = string.concat(betId, Strings.toString(guessId));
        storageByHash.uploadData(guessStorageId, valueToBinary(guessedNumber, nonce));

        Guess storage selectedGuess = selectedBet.guesses[guessId];
        require(!selectedGuess.evaluated, "Guess already evaluated");
        selectedGuess.guess = guessedNumber;
        selectedGuess.nonce = nonce;

        selectedGuess.evaluated = true;
        _updateOptions(selectedBet, selectedGuess);
        if(selectedGuess.guess == selectedBet.answer){
            selectedGuess.bettor.transfer(multMoney(selectedGuess.amount,selectedBet.course));
        }else{
            selectedBet.owner.transfer(selectedGuess.amount);
        }
    }


    /**
    Finish the bet and withdraw money. If the answer was not revealed give rewards to all participants else withdraw all free money to owner
     */
    function forceFinishBet(string calldata betId) public nonReentrant() betExists(betId) {
        Bet storage selectedBet = storedBets[betId];
        require(selectedBet.status != Status.FINNISHED, "Bet is already finished");
        if(selectedBet.status == Status.RUNNING){//Answer was not provided
            require(block.timestamp > selectedBet.answerRevealDeadline, "It is too soon, answerRevealDeadline was not reached.");
            return _forceFinishBet(selectedBet);
        }//Answer was provided, and we need to collect those unclaimed money, from those who did not reveal their guesses :)
        require(block.timestamp > selectedBet.prizeClaimDeadline, "It is too soon, prizeClaimDeadline was not reached.");
        uint256 collectedUntilNow = 0;
        for(uint i=0; i< selectedBet.guesses.length; i++){
            Guess memory guess = selectedBet.guesses[i];
            if(guess.evaluated){
                collectedUntilNow += multMoney(guess.amount,selectedBet.course);
            }
        }
        selectedBet.status = Status.FINNISHED;
        selectedBet.owner.transfer(selectedBet.betLimit - collectedUntilNow);
    }

    function _forceFinishBet(Bet storage selectedBet) internal{
        selectedBet.status = Status.FINNISHED;
        for(uint i=0; i<selectedBet.guesses.length; i++){
            Guess memory guess = selectedBet.guesses[i];
            guess.bettor.transfer(multMoney(guess.amount,selectedBet.course));
        }
        selectedBet.owner.transfer(selectedBet.betLimit +selectedBet.totalBets- multMoney(selectedBet.totalBets,selectedBet.course));
        selectedBet.status = Status.FINNISHED;
    }
}

