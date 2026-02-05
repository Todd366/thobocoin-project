// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./THoBoCoin.sol";

/**
 * @title BSTMRoomRegistry
 * @dev Manages BSTM's 63 rooms ecosystem
 */
contract BSTMRoomRegistry is Ownable, ReentrancyGuard {
    
    THoBoCoin public thoboCoin;
    
    struct Room {
        string name;
        string description;
        address manager;
        uint256 liquidityContributed;
        uint256 transactionVolume;
        bool active;
        uint256 createdAt;
    }
    
    mapping(uint256 => Room) public rooms;
    mapping(address => uint256[]) public managerRooms;
    uint256 public totalRooms;
    uint256 public constant MAX_ROOMS = 63;
    uint256 public totalLiquidityPool;
    
    event RoomCreated(uint256 indexed roomId, string name, address manager);
    event LiquidityContributed(uint256 indexed roomId, uint256 amount);
    event TransactionRecorded(uint256 indexed roomId, uint256 volume);
    
    constructor(address _thoboCoinAddress) {
        require(_thoboCoinAddress != address(0), "Invalid address");
        thoboCoin = THoBoCoin(_thoboCoinAddress);
    }
    
    function createRoom(
        string memory name,
        string memory description,
        address manager
    ) external onlyOwner returns (uint256) {
        require(totalRooms < MAX_ROOMS, "Maximum rooms reached");
        require(manager != address(0), "Invalid manager");
        require(bytes(name).length > 0, "Name required");
        
        uint256 roomId = totalRooms + 1;
        
        rooms[roomId] = Room({
            name: name,
            description: description,
            manager: manager,
            liquidityContributed: 0,
            transactionVolume: 0,
            active: true,
            createdAt: block.timestamp
        });
        
        managerRooms[manager].push(roomId);
        totalRooms++;
        
        emit RoomCreated(roomId, name, manager);
        return roomId;
    }
    
    function contributeLiquidity(uint256 roomId, uint256 amount) external nonReentrant {
        require(roomId > 0 && roomId <= totalRooms, "Invalid room");
        Room storage room = rooms[roomId];
        require(room.active, "Room not active");
        require(msg.sender == room.manager, "Not manager");
        require(amount > 0, "Amount must be > 0");
        
        require(
            thoboCoin.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        room.liquidityContributed += amount;
        totalLiquidityPool += amount;
        
        emit LiquidityContributed(roomId, amount);
    }
    
    function recordTransaction(uint256 roomId, uint256 volume) external {
        require(roomId > 0 && roomId <= totalRooms, "Invalid room");
        Room storage room = rooms[roomId];
        require(room.active, "Room not active");
        require(msg.sender == room.manager, "Not manager");
        
        room.transactionVolume += volume;
        emit TransactionRecorded(roomId, volume);
    }
    
    function getRoom(uint256 roomId) external view returns (
        string memory name,
        string memory description,
        address manager,
        uint256 liquidityContributed,
        uint256 transactionVolume,
        bool active,
        uint256 createdAt
    ) {
        require(roomId > 0 && roomId <= totalRooms, "Invalid room");
        Room memory room = rooms[roomId];
        return (
            room.name,
            room.description,
            room.manager,
            room.liquidityContributed,
            room.transactionVolume,
            room.active,
            room.createdAt
        );
    }
    
    function getEcosystemMetrics() external view returns (
        uint256 activeRooms,
        uint256 totalLiquidity,
        uint256 totalVolume,
        uint256 totalRewardsDistributed
    ) {
        activeRooms = 0;
        totalLiquidity = totalLiquidityPool;
        totalVolume = 0;
        
        for (uint256 i = 1; i <= totalRooms; i++) {
            if (rooms[i].active) {
                activeRooms++;
            }
            totalVolume += rooms[i].transactionVolume;
        }
        
        totalRewardsDistributed = 0;
    }
}
