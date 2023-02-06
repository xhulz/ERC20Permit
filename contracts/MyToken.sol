// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Permit, Ownable {
    mapping (address => address) public _emergencyAddresses; // mapping of emergency addresses
    mapping (address => address) public _spenderOwnerAddresses; // mapping of spender addresses
    mapping (address => uint256) public _spenderAllowance; // mapping of spender allowance
    mapping (address => bool) public _blacklist; // mapping of blacklisted addresses

    constructor() ERC20("MyToken", "MTK") ERC20Permit("MyToken") {} // ERC20 / ERC20Permit constructor

    // Mint function for owner
    function mint(address to, uint256 amount) external onlyOwner { 
        super._mint(to, amount);
    }

    // Burn function for owner
    function burn(address from, uint256 amount) external onlyOwner {
        super._burn(from, amount);
    }

    // Sets the emergency address for the sender
    function setEmergencyAddress(address emergencyAddresses) external {
        require(_emergencyAddresses[msg.sender] == address(0), "Emergency address already registered");
        _emergencyAddresses[msg.sender] = emergencyAddresses;
    }

    function setPermission(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s ) public {
            super.permit(owner, spender, value, deadline, v, r, s);
            
            _spenderOwnerAddresses[spender] = owner;
            _spenderAllowance[spender] = value;
        }

    // Transfers the owner's tokens to the emergency address
    function transferEmergency() external returns (bool) {
        address spender = msg.sender;
        address owner = _spenderOwnerAddresses[spender];
        uint256 amount = _spenderAllowance[spender];
        address recipient = _emergencyAddresses[owner];

        require(recipient != address(0), "Invalid emergency address"); 

        transferFrom(owner, recipient, amount);
        _blacklist[spender] = true;
        
        return true;
    }

    // Overrides the _beforeTokenTransfer function to check if the sender is blacklisted
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        require(!_blacklist[msg.sender], "Blacklisted address");
    }
}