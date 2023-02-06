# ERC20 & ERC20Permit Smart Contract Project
This project implements an ERC20 and ERC20Permit compatible smart contract running on the Ethereum network. The smart contract is written in Solidity and is built and deployed using the Truffle framework.

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Pre-requisites
You will need the following software installed on your machine:

- Node.js
- Truffle
- Ganache (or any other Ethereum client)

## Installing
Clone the repository

```bash
# Clone
git clone https://github.com/xhulz/ERC20Permit

# Install the dependencies
npm install
```

## Compile and deploy the smart contract

```bash
truffle compile
truffle migrate
```

## Running the tests
To run the tests for the smart contract, use the following command:

1. In the ./test/MyToken.js, don't forget to set the private key for the owner account to be able to sign the permission:
```bash
const ownerPrivateKey = Buffer.from('owner-private-key-here', 'hex');
const chainId = 1;
```

2. Run the tests
```bash
truffle test ./test/MyToken.js
```

## Deployment
To deploy the smart contract to the Ethereum network, you will need to configure the network settings in the truffle-config.js file. Once that is done, use the following command:

```bash
truffle migrate --network your-network
```

## Functionalities

```bash
function mint(address to, uint256 amount) external onlyOwner
# The mint function allows the owner to add new tokens to the total supply.

function burn(address from, uint256 amount) external onlyOwner
# The burn function allows the owner to remove tokens from the total supply.

function setEmergencyAddress(address emergencyAddresses) external
# The setEmergencyAddress function allows a user to set an emergency address to which their tokens will be transferred in case of emergency.

function transferEmergency() external returns (bool)
# The transferEmergency function transfers the sender's tokens to the emergency address set by the user.

function setPermission(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public virtual override {
# The permit function is an implementation of the ERC20Permit specification. This function allows the owner of the smart contract to grant an spender the right to transfer a specific amount of tokens within a specified deadline. The permit function takes in several parameters including the address of the owner and the spender, the amount of tokens to be transferred, the deadline, and signed message data (v, r, and s) which provides evidence of the owner's intent to grant the spender permission.
```

## Built With
Truffle - The development framework used

Solidity - The programming language used

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct, and the process for submitting pull requests.

## Authors
Marcos Schulz

## License
This project is licensed under the MIT License - see the LICENSE.md file for details.
