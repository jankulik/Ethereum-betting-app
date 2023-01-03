//SPDX-License-Identifier: Do not still
pragma solidity >=0.8.17 <0.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./StorageByHash.sol";


/**
Base class for creating Bets
 */
contract BetBase is ReentrancyGuard{
    enum Status{NOT_CREATED, RUNNING, WAITING_FOR_ANSWER, ANSWER_REVEALED, FINNISHED}
    
    struct Guess{
        uint256 id;
        address payable bettor;
        uint256 amount;
        bool evaluated;
        int256 guess;
        int256 nonce;
    }

    struct Option{
        int256 value;
        uint256 totalBet;
    }
    
    struct Bet {
        string id;//also id of storage
        string name;
        string description;
        address payable owner;
        int256 answer;
        int256 nonce;
        uint256 totalBets;
        uint256 betLimit;
        uint256 course;
        uint256 bettingDeadline;
        uint256 answerRevealDeadline;
        uint256 prizeClaimDeadline;
        Status status;
        bool hasWhitelist;
        mapping(address => bool) whitelist;
        mapping(address => bool) blacklist;
        Guess[] guesses;
        Option[] options;
        mapping(int256 => uint256) optionValueToId;
        mapping(int256 => bool) optionExists;
        bool hasRestrictedOptions;
    }

    struct ReturnedBet{
        string id;//also id of storage
        address payable owner;
        int answer;
        uint totalBets;
        uint betLimit;
        uint course;
        string name;
        string description;
        uint bettingDeadline;
        uint answerRevealDeadline;
        uint prizeClaimDeadline;
        Status status;
        Option[] options;
        bool hasRestrictedOptions;
    }

    struct UserGuess{
        uint256 guessId;
        string betId;
    }

    StorageByHash storageByHash;

    mapping(address => string[]) public userBets;

    mapping(string => Bet) internal storedBets;

    mapping(address => UserGuess[]) public userGuesses;

    modifier betExists(string memory betId){
        require(bytes(storedBets[betId].id).length!=0, string.concat("BaseBet does not exist: ", betId));
        _;
    }

    modifier betNotExists(string memory betId){
        require(bytes(storedBets[betId].id).length==0, "Bet already exists");
        _;
    }

    modifier beforeBettingDeadline(string memory betId){
        require(block.timestamp < storedBets[betId].bettingDeadline, "Bet is no longer open");
        _;
    }

    modifier statusRunning(string memory betId){
        require(storedBets[betId].status == Status.RUNNING, "Bet is no longer open");
        _;
    }

    modifier statusAnswerRewealed(string memory betId){
        require(storedBets[betId].status == Status.ANSWER_REVEALED, "Bet status is not answer reveal");
        _;
    }
    

    modifier betOpen(string memory betId){
        require(block.timestamp < storedBets[betId].bettingDeadline, "Bet is no longer open");
        require(storedBets[betId].status == Status.RUNNING, "Bet is no longer open");
        _;
    }

    modifier betOwner(string memory betId){
        require(msg.sender == storedBets[betId].owner, "You need to be the owner");
        _;
    }

    modifier guessOwner(string memory betId, uint256 guessId){
        require(msg.sender == storedBets[betId].guesses[guessId].bettor, "You need to be the bettor");
        _;
    }

    modifier guessNotEvaluated(string memory betId, uint256 guessId){
        require(!storedBets[betId].guesses[guessId].evaluated, "Gues was already evaluated");
        _;
    }

    modifier minValue(){
        require(msg.value >= 1, "You need to send some money");
        _;
    }

    modifier isWhitelisted(string memory betId){
        require(!storedBets[betId].hasWhitelist || storedBets[betId].whitelist[msg.sender], "Creater of the bet did not want you to take part in this bet");
        _;
    }

    modifier notBlacklisted(string memory betId){
        require(!storedBets[betId].blacklist[msg.sender], "You were blacklisted by author");
        _;
    }

    modifier isInAnswerRevealPeriod(string memory betId){
        require(block.timestamp  > storedBets[betId].bettingDeadline, "It is too soon, deadline was not reached.");
        require(block.timestamp  <= storedBets[betId].answerRevealDeadline, "It is too late.");
        _;
    }

    modifier isInPrizeClaimPeriod(string memory betId){
        require(block.timestamp  > storedBets[betId].answerRevealDeadline, "It is too soon, deadline was not reached.");
        require(block.timestamp  <= storedBets[betId].prizeClaimDeadline, "It is already after prize claim deadline late.");
        _;
    }

    modifier afterAnswerRevelPeriod(string memory betId){
        require(block.timestamp > storedBets[betId].answerRevealDeadline, "It is too soon, answearRevealDeadline was not reached.");
        _; 
    }

    constructor(address storageContractAddress) {
        storageByHash = StorageByHash(storageContractAddress);
    }

    /**
    Assign deadlines to a bet.
     */
    function _createDeadlines(string calldata id, uint256 bettingDeadline, uint256 answerRevealDeadline, uint256 prizeClaimDeadline)  betNotExists(id) internal {
        storedBets[id].bettingDeadline = bettingDeadline;
        storedBets[id].answerRevealDeadline = answerRevealDeadline;
        storedBets[id].prizeClaimDeadline = prizeClaimDeadline;
    }

    /**
    Creates a bet with given parameters.
     */
    function _createBet(string calldata id, string memory name, string memory description, address payable owner, uint256 betLimit, uint256 course, address[] memory whitelist, address[] memory blacklist, int256[] memory restrictedOptions)  betNotExists(id) internal {
        storedBets[id].id = id;
        storedBets[id].name = name;
        storedBets[id].description = description;
        storedBets[id].owner = owner;
        storedBets[id].totalBets = 0;
        storedBets[id].betLimit = betLimit;
        storedBets[id].course = course;
        storedBets[id].status = Status.RUNNING;
        if(whitelist.length > 0){
            storedBets[id].hasWhitelist = true;
            for(uint i=0;i<whitelist.length;i++)
                storedBets[id].whitelist[whitelist[i]] = true;
        }
        if(blacklist.length > 0){
            for(uint i=0;i<blacklist.length;i++)
                storedBets[id].blacklist[blacklist[i]] = true;
        }
        if(restrictedOptions.length > 0){
            storedBets[id].hasRestrictedOptions = true;
            for(uint i=0; i< restrictedOptions.length; i++){
                storedBets[id].optionExists[restrictedOptions[i]] = true;
                storedBets[id].optionValueToId[restrictedOptions[i]] = storedBets[id].options.length;
                storedBets[id].options.push(Option(restrictedOptions[i], 0));
            } 
        }
        userBets[msg.sender].push(id);
    }
    

    /**
    Transfers money to contracts acount and increases betLimit
     */
    function topUp(string calldata betId) payable public betExists(betId) betOpen(betId) betOwner(betId) minValue(){
        storedBets[betId].betLimit += msg.value;
    }

    /**
    Adds an address to whitelist if Bet already had a whitelist
     */
    function whitelistAddress(string memory betId, address guesser) public betExists(betId)  betOpen(betId){
        Bet storage selectedBet = storedBets[betId];
        require(selectedBet.hasWhitelist, "You cannot add to whitelist if there was not one before");
        require(!selectedBet.whitelist[guesser], "Guesser has been whiteliste already.");
        selectedBet.whitelist[guesser] = true;
    }

    /**
    Updates options statictics for a bet. (Amount of money bet on a given option by all users)
     */
    function _updateOptions(Bet storage selectedBet, Guess memory newGuess) internal{
        if(!selectedBet.optionExists[newGuess.guess]){
            require(!selectedBet.hasRestrictedOptions, "Betting is restricted to only given options.");
            selectedBet.optionExists[newGuess.guess] = true;
            selectedBet.optionValueToId[newGuess.guess] = selectedBet.options.length;
            selectedBet.options.push(Option(newGuess.guess, newGuess.amount));
        }else{
            uint256 optionId = selectedBet.optionValueToId[newGuess.guess];
            selectedBet.options[optionId].totalBet+=newGuess.amount;
        }
    }
    
    /**
    Returns all users bets.
     */
    function getUserBets(address owner) public view returns (ReturnedBet[] memory){
        string[] memory betIds = userBets[owner];
        ReturnedBet[] memory bets = new ReturnedBet[](betIds.length);
        for (uint i = 0; i < bets.length; i++) {
          bets[i] = convertBetToReturn(storedBets[betIds[i]]);
        }
      return bets;
    }
    
    function getUserBetsNormal(address owner) public view returns (ReturnedBet[] memory){
        string[] memory betIds = userBets[owner];
        ReturnedBet[] memory bets = new ReturnedBet[](betIds.length);
        for (uint i = 0; i < bets.length; i++) {
          bets[i] = convertBetToReturn(storedBets[betIds[i]]);
        }
      return bets;
    }
    
    function getUserSecretBets(address owner) public view returns (ReturnedBet[] memory){
        string[] memory betIds = userBets[owner];
        ReturnedBet[] memory bets = new ReturnedBet[](betIds.length);
        for (uint i = 0; i < bets.length; i++) {
          bets[i] = convertBetToReturn(storedBets[betIds[i]]);
        }
      return bets;
    }


    /**
    Returns guess by betId and guessId.
     */
    function getGuess(string memory betId, uint guessId) public view betExists(betId) returns(Guess memory){
        return storedBets[betId].guesses[guessId];
    }

    /**
    Returns all bet guesses.
     */
    function getGuesses(string memory betId) public view betExists(betId) returns(Guess[] memory){
        return storedBets[betId].guesses;
    }

    /**
    Returns user guesses
     */
    function getUserGuesses(address guesser) public view returns(UserGuess[] memory){
        return userGuesses[guesser];
    }

    /**
    Returns bet Options containing statistics of answers.
     */
    function getOptions(string memory betId) public view betExists(betId) returns(Option[] memory){
        return storedBets[betId].options;
    }

    /**
    Returns bet by id
     */
    function getBet(string memory  betId) public view betExists(betId) returns(ReturnedBet memory){
        return convertBetToReturn(storedBets[betId]);
    }
    function getSecretBet(string memory  betId) public view betExists(betId) returns(ReturnedBet memory){
        return convertBetToReturn(storedBets[betId]);
    }

    function convertBetToReturn(Bet storage betToConvert) private view returns (ReturnedBet memory){
        return ReturnedBet(betToConvert.id,
        betToConvert.owner,
        betToConvert.answer,
        betToConvert.totalBets,
        betToConvert.betLimit,
        betToConvert.course,
        betToConvert.name,
        betToConvert.description,
        betToConvert.bettingDeadline,
        betToConvert.answerRevealDeadline,
        betToConvert.prizeClaimDeadline,
        betToConvert.status,
        betToConvert.options,
        betToConvert.hasRestrictedOptions);
    }

    /**
    Returns bytes encoding of answer for user to manually check hash if he wanted to confirm validity of a guess
     */
    function valueToBinary(int256 answer, int256 nonce) public pure returns (bytes memory){
        return abi.encodePacked(answer, nonce);
    }

    /**
    Returns encrypted data stored on a chain.
     */
    function getEncryptedData(string memory betId) external view betExists(betId) returns (bytes memory){
        (,,,bytes memory encryptedData) = storageByHash.storedItems(betId);
        return encryptedData;
    }    
    
    /**
    Returns encrypted data stored on a chain.
     */
    function getSecretEncryptedData(string memory guessStorageId) external view returns (bytes memory){
        (,,,bytes memory encryptedData) = storageByHash.storedItems(guessStorageId);
        return encryptedData;
    }

    /*
    currently there are 120 mln ETH which is 1.2 * 10^26 Wei 2^256/10^26 ~~~ 1.1*10^51 so we can savely reserve 17 decimal places without worying about integer overflow
    */
    function multMoney(uint256 money, uint256 course) public pure returns (uint256){
        return (money*course)/10**17;
    }

    /**
    Helper function to decrease course by 1
     */
    function decreaseCourse(uint256 course)internal pure returns(uint256){
        return course - 100000000000000000;
    }
}