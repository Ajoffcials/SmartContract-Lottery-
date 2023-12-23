//Raffle
//Enter the lottery
//pick a random winner
//winner to be selected every x minutes
//  chainlink Oracle

// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;
//import
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

error Raffle__NotEnoughEth();
error Raffle__TransferFalied();
error Raffle__NotOpen();
error Raffle__upKeepNotNeeded(
    uint256 balance,
    uint256 playersLength,
    uint256 raffleState
);

contract Raffle is VRFConsumerBaseV2, AutomationCompatible {
    //type
    enum RaffleState {
        OPEN,
        CALCULATING
    }
    //state variable
    uint256 private immutable enteranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable COORDINATOR;
    bytes32 private immutable s_keyhash;
    uint64 private i_subscriptionId;
    uint16 private constant REQUESTCONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUMWORDS = 1;
    uint256 private immutable i_interval;
    //lottery variables
    address payable private s_recentWinner;
    RaffleState private s_RaffleState;
    uint256 private s_lastTimeStamp;
    //events
    event RaffleEnter(address indexed player);
    event IdRequest(uint256 indexed id);
    event winnerPicked(address indexed winner);

    //constructor
    constructor(
        address _vrfCoordinator, // CONTRACTADDRESS
        uint256 _entranceFee,
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit,
        uint256 _interval
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        enteranceFee = _entranceFee;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        s_keyhash = _keyHash;
        i_subscriptionId = _subscriptionId;
        i_callbackGasLimit = _callbackGasLimit;
        s_RaffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = _interval;
    }

    //function
    function enterRaffle() public payable {
        if (msg.value < enteranceFee) {
            revert Raffle__NotEnoughEth();
        }
        if (s_RaffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function checkUpkeep(
        bytes memory /*checkData*/
    )
        public
        override
        returns (bool upkeepNeeded, bytes memory /*performData*/)
    {
        bool isOpen = (s_RaffleState == RaffleState.OPEN);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayer = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);
        upkeepNeeded = (isOpen && timePassed && hasPlayer && hasBalance);
        return (upkeepNeeded, "");
    }

    // function pickRandomWinner() external {}
    function performUpkeep(bytes calldata /*performData*/) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__upKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_RaffleState)
            );
        }
        s_RaffleState = RaffleState.CALCULATING;
        uint256 requestId = COORDINATOR.requestRandomWords(
            s_keyhash,
            i_subscriptionId,
            REQUESTCONFIRMATIONS,
            i_callbackGasLimit,
            NUMWORDS
        );
        emit IdRequest(requestId);
    }

    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] memory randomWords
    ) internal virtual override {
        uint256 winnerIndex = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[winnerIndex];
        s_recentWinner = recentWinner;
        s_RaffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        s_players = new address payable[](0);
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFalied();
        }
        emit winnerPicked(recentWinner);
    }

    //view and pure

    function getEntranceFee() public view returns (uint256) {
        return enteranceFee;
    }

    function getPlayers(uint256 _playerIndex) public view returns (address) {
        address payable[] memory cheapPlayer = s_players;
        return cheapPlayer[_playerIndex];
    }

    function getWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (uint256) {
        return uint256(s_RaffleState);
    }

    function getNumWords() public pure returns (uint256) {
        return NUMWORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUESTCONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getCordinator() public view returns (VRFCoordinatorV2Interface) {
        return COORDINATOR;
    }

    function getSubscriptionId() public view returns (uint256) {
        return i_subscriptionId;
    }
}
