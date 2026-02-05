// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title THoBoCoin
 * @dev BEP-20 Token for BSTM Ecosystem
 */
contract THoBoCoin is ERC20, ERC20Burnable, Pausable, Ownable, ReentrancyGuard {
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    mapping(address => bool) public bstmRooms;
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lockPeriod;
    }
    
    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    
    event TokensStaked(address indexed user, uint256 amount, uint256 lockPeriod);
    event TokensUnstaked(address indexed user, uint256 amount);
    
    constructor() ERC20("THoBoCoin", "THB") {
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 amount) 
        internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    function stake(uint256 amount, uint256 lockPeriod) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        
        stakes[msg.sender] = Stake({
            amount: amount,
            timestamp: block.timestamp,
            lockPeriod: lockPeriod
        });
        
        totalStaked += amount;
        emit TokensStaked(msg.sender, amount, lockPeriod);
    }
    
    function unstake() external nonReentrant {
        Stake memory userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No active stake");
        require(block.timestamp >= userStake.timestamp + userStake.lockPeriod, "Locked");
        
        uint256 amount = userStake.amount;
        delete stakes[msg.sender];
        totalStaked -= amount;
        
        _transfer(address(this), msg.sender, amount);
        emit TokensUnstaked(msg.sender, amount);
    }
    
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }
    
    function totalBurned() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}
