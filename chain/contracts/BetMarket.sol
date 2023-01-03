//SPDX-License-Identifier: Do not still
pragma solidity ^0.8.0;

/// @notice Library SafeMath used to prevent overflows and underflows
//import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// import "hardhat/console.sol";

contract BetMarket {
    // using SafeMath for uint256; SafeMath is not needed from solidity 0.8
    // using SafeMath for int256;
    
    enum BetStatus {
        RUNNING,
        FINISHED
    }

    enum OrderStatus {
        UNFILLED,
        FILLED,
        CANCELLED
    }

    enum OrderType {
        BUY,
        SELL
    }

    struct Order {
        address payable creator;
        address filler;
        uint256 optionId;
        uint256 amountOTM;
        uint256 amountWei;
        OrderStatus status;
        OrderType orderType;
    }

    struct Balance {
        address payable user;
        uint256[] tokens;
    }

    struct Bet {
        string id;
        string name;
        string description;
        uint256 value;
        address payable owner;
        address payable arbitrator;
        string[] options;
        Balance[] balances;
        uint256 bettingDeadline;
        uint256 answerRevealDeadline;
        Order[] orders;
        BetStatus status;
        uint256 winningOptionId;
    }

    struct UserBalance {
        uint256 balanceId;
        string betId;
    }

    struct UserOrder {
        uint256 orderId;
        string betId;
    }

    mapping(string => Bet) internal storedBets;
    mapping(address => string[]) internal userBets;

    mapping(address => string[]) internal betsUserParticipate;
    mapping(string => mapping(address => bool)) internal doesParticipate;

    modifier betExists(string memory betId) {
        require(bytes(storedBets[betId].id).length!=0, "Bet does not exist");_;
    }

    modifier betNotExists(string memory betId) {
        require(bytes(storedBets[betId].id).length==0, "Bet already exists");_;
    }

    modifier beforeBettingDeadline(string memory betId) {
        require(block.timestamp < storedBets[betId].bettingDeadline, "Bet is no longer open");_;
    }

    modifier statusRunning(string memory betId) {
        require(storedBets[betId].status == BetStatus.RUNNING, "Bet is no longer open");_;
    }

    modifier minValue() {
        require(msg.value >= 1, "You need to send some money");_;
    }

    modifier orderExists(string memory betId, uint256 orderId) {
        require(orderId < storedBets[betId].orders.length, "This order does not exist");_;
    }

    modifier checkPrice(uint256 amountWei, uint256 amountOTM) {
        require(amountWei * 100 / amountOTM >= 1, "Price must be larger or equal to 0.01");
        require(amountWei * 100 / amountOTM <= 99, "Price must be smaller or equal to 0.99");
        _;
    }

    function createBet(
        string calldata id,
        string memory name,
        string memory description,
        address payable arbitrator,
        string[] memory options,
        uint256 bettingDeadline,
        uint256 answerRevealDeadline
    ) public payable betNotExists(id){
        require(bettingDeadline >= block.timestamp, "Deadline already passed");
        require(answerRevealDeadline >= bettingDeadline, "Answer reveal must be later than betting deadline");

        storedBets[id].id = id;
        storedBets[id].name = name;
        storedBets[id].description = description;
        storedBets[id].value = msg.value;
        storedBets[id].owner = payable(msg.sender);
        storedBets[id].arbitrator = arbitrator;
        storedBets[id].bettingDeadline = bettingDeadline;
        storedBets[id].answerRevealDeadline = answerRevealDeadline;
        storedBets[id].status = BetStatus.RUNNING;
        storedBets[id].winningOptionId = options.length + 1;

        uint256[] memory balances = new uint256[](options.length);
        for (uint256 i = 0; i < options.length; i++) {
            storedBets[id].options.push(options[i]);
            balances[i] = msg.value;
        }

        storedBets[id].balances.push(Balance(payable(msg.sender), balances));
        userBets[msg.sender].push(id);
    }

    function getUserBalance(string memory betId, address payable user) public view betExists(betId) returns(Balance memory) {
        Bet storage selectedBet = storedBets[betId];
        for (uint256 i = 0; i < selectedBet.balances.length; i++) {
            if (selectedBet.balances[i].user == user) {
                return selectedBet.balances[i];
            }
        }
        uint256[] memory balances = new uint256[](selectedBet.options.length);
        return Balance(user, balances);
    }

    function moveTokens(string memory betId, address payable user, uint256 optionId, int256 amount) private {
        Bet storage selectedBet = storedBets[betId];
        for (uint256 i = 0; i < selectedBet.balances.length; i++) {
            if (selectedBet.balances[i].user == user) {
                if (amount >= 0) {
                    selectedBet.balances[i].tokens[optionId] += uint256(amount);
                } else {
                    selectedBet.balances[i].tokens[optionId] -= uint256(-1 * amount);
                }
            }
        }
    }

    function createSellOrder(string memory betId, uint256 optionId, uint256 amountOTM, uint256 amountWei) public checkPrice(amountWei, amountOTM) betExists(betId) beforeBettingDeadline(betId){
        require(amountOTM > 0, "Amount must be greater than 0");
        Bet storage selectedBet = storedBets[betId];
        uint256 userBalance = getUserBalance(betId, payable(msg.sender)).tokens[optionId];
        require(userBalance >= amountOTM, "You don't have enough tokens");
        
        moveTokens(betId, payable(msg.sender), optionId, -1 * int256(amountOTM));
        
        Order memory newOrder = Order(payable(msg.sender), address(0x0), optionId, amountOTM, amountWei, OrderStatus.UNFILLED, OrderType.SELL);
        selectedBet.orders.push(newOrder);
        ensureParticipates(msg.sender, betId);
    }

    function fillSellOrder(string memory betId, uint256 orderId) public payable minValue() betExists(betId) beforeBettingDeadline(betId) orderExists(betId, orderId){
        Bet storage selectedBet = storedBets[betId];
        Order storage order = selectedBet.orders[orderId];
        require(order.status != OrderStatus.CANCELLED, "This order has already been cancelled"); // CONSIDER: using modifiers
        require(order.status != OrderStatus.FILLED, "This order has already been filled");
        require(order.creator != payable(msg.sender), "You cannot fill your own order");
        require(order.amountWei >= msg.value, "The order doesn't contain enough outcome tokens");
        
        order.status = OrderStatus.FILLED;
        initialiseUserBalance(betId, payable(msg.sender));
        moveTokens(betId, payable(msg.sender), order.optionId, int256(order.amountOTM * msg.value / order.amountWei));
        order.creator.transfer(msg.value);

        if (order.amountWei > msg.value) {
            Order memory newOrder = Order(order.creator, address(0x0), order.optionId, order.amountOTM - order.amountOTM * msg.value / order.amountWei, order.amountWei - msg.value, OrderStatus.UNFILLED, OrderType.SELL);
            selectedBet.orders.push(newOrder);
            order.amountOTM = order.amountOTM * msg.value / order.amountWei;
            order.amountWei = msg.value;
        }
        ensureParticipates(msg.sender, betId);
    }

    function createBuyOrder(string memory betId, uint256 optionId, uint256 amountOTM) public payable minValue() betExists(betId) beforeBettingDeadline(betId) checkPrice(msg.value, amountOTM){
        Bet storage selectedBet = storedBets[betId];
        Order memory newOrder = Order(payable(msg.sender), address(0x0), optionId, amountOTM, msg.value, OrderStatus.UNFILLED, OrderType.BUY);
        selectedBet.orders.push(newOrder);
        ensureParticipates(msg.sender, betId);
    }

    function cancelOrder(string memory betId, uint256 orderId) public betExists(betId) orderExists(betId, orderId) {
        Bet storage selectedBet = storedBets[betId];
        Order storage order = selectedBet.orders[orderId];
        require(order.status != OrderStatus.FILLED, "This order has already been filled");
        require(order.status != OrderStatus.CANCELLED, "This order has already been cancelled");
        require(order.creator == payable(msg.sender), "Only the owner can cancel their order");

        order.status = OrderStatus.CANCELLED;
        if (order.orderType == OrderType.BUY) {
            payable(msg.sender).transfer(order.amountWei);
        } else {
            moveTokens(betId, payable(msg.sender), order.optionId, int256(order.amountOTM));
        }
    }

    function fillBuyOrder(string memory betId, uint256 orderId, uint256 amountOTM) public betExists(betId) beforeBettingDeadline(betId) orderExists(betId, orderId){
        require(amountOTM > 0, "Amount must be greater than 0");
        Bet storage selectedBet = storedBets[betId];
        Order storage order = selectedBet.orders[orderId];
        require(order.status != OrderStatus.CANCELLED, "This order has already been cancelled");
        require(order.status != OrderStatus.FILLED, "This order has already been filled");
        require(order.creator != payable(msg.sender), "You cannot fill your own order");
        require(order.amountOTM >= amountOTM, "The order doesn't contain enough outcome tokens");
        require(getUserBalance(betId, payable(msg.sender)).tokens[order.optionId] >= amountOTM, "You don't have enough tokens");

        order.status = OrderStatus.FILLED;
        initialiseUserBalance(betId, order.creator);
        moveTokens(betId, payable(msg.sender), order.optionId, -1 * int256(amountOTM));
        moveTokens(betId, order.creator, order.optionId, int256(amountOTM));
        payable(msg.sender).transfer(amountOTM * order.amountWei / order.amountOTM);

        if (order.amountOTM > amountOTM) {
            Order memory newOrder = Order(order.creator, address(0x0), order.optionId, order.amountOTM - amountOTM, order.amountWei - amountOTM * order.amountWei / order.amountOTM, OrderStatus.UNFILLED, OrderType.BUY);
            selectedBet.orders.push(newOrder);
            order.amountWei = amountOTM * order.amountWei / order.amountOTM;
            order.amountOTM = amountOTM;
        }
        ensureParticipates(msg.sender, betId);
    }

    function getOrders(string memory betId) public view betExists(betId) returns(Order[] memory) {
        return storedBets[betId].orders;
    }

    function initialiseUserBalance(string memory betId, address payable user) private {
        Bet storage selectedBet = storedBets[betId];
        
        bool initialised = false;
        for (uint256 i = 0; i < selectedBet.balances.length; i++) {
            if (user == selectedBet.balances[i].user) {
                initialised = true;
                break;
            }
        }

        if (!initialised) {
            uint256[] memory balances = new uint256[](selectedBet.options.length);
            for (uint256 i = 0; i < selectedBet.options.length; i++) {
                balances[i] = 0;
            }

            selectedBet.balances.push(Balance(user, balances));
        }
    }

    function getUserBets(address user) public view returns(Bet[] memory) {
        string[] memory betIds = userBets[user];
        Bet[] memory bets = new Bet[](betIds.length);

        for (uint i = 0; i < bets.length; i++) {
            bets[i] = storedBets[betIds[i]];
        }

        return bets;
    }

    function getBet(string memory betId) public view betExists(betId) returns(Bet memory) {
        return storedBets[betId];
    }

    function resolveBet(string memory betId, uint256 winningOptionId) public betExists(betId) statusRunning(betId){
        Bet storage selectedBet = storedBets[betId];
        require(block.timestamp > selectedBet.bettingDeadline, "Betting deadline was not reached yet");
        require(block.timestamp <= selectedBet.answerRevealDeadline, "Answer reveal deadline has passed");
        require(msg.sender == selectedBet.arbitrator, "You are not the selected arbitrator");
        require(winningOptionId < selectedBet.options.length, "This option does not exist");
        
        selectedBet.status = BetStatus.FINISHED;
        for (uint256 i = 0; i < selectedBet.orders.length; i++) {
            if (selectedBet.orders[i].status == OrderStatus.UNFILLED) {            
                cancelOrder(betId, i);
            }
        }

        for (uint256 i = 0; i < selectedBet.balances.length; i++) {
            if (selectedBet.balances[i].tokens[winningOptionId] > 0) {
                selectedBet.balances[i].user.transfer(selectedBet.balances[i].tokens[winningOptionId]);
            }
        }

        selectedBet.winningOptionId = winningOptionId;
    }

    function forceFinishBet(string calldata betId) public betExists(betId) statusRunning(betId){
        Bet storage selectedBet = storedBets[betId];
        require(block.timestamp > selectedBet.answerRevealDeadline, "Answer reveal deadline was not reached yet");
        
        selectedBet.status = BetStatus.FINISHED;

        for (uint256 i = 0; i < selectedBet.orders.length; i++) {
            if (selectedBet.orders[i].status == OrderStatus.UNFILLED) {            
                cancelOrder(betId, i);
            }
        }
        
        for (uint256 i = 0; i < selectedBet.balances.length; i++) {
            uint256 tokensOwned = 0;
            for (uint256 j = 0; j < selectedBet.options.length; j++) {
                tokensOwned += selectedBet.balances[i].tokens[j];
            }
            selectedBet.balances[i].user.transfer(tokensOwned / selectedBet.options.length);
        }
    }

    function ensureParticipates(address user, string memory betId) public {
        if(!doesParticipate[betId][user]){
            doesParticipate[betId][user] = true;
            betsUserParticipate[user].push(betId);
        }
    }

    function getBetsParticipated(address user) public view returns(Bet[] memory) {   
        string[] memory betIds = betsUserParticipate[user];
        Bet[] memory bets = new Bet[](betIds.length);

        for (uint i = 0; i < bets.length; i++) {
            bets[i] = storedBets[betIds[i]];
        }

        return bets;
    }
}
