const MyToken = artifacts.require("./MyToken.sol");

contract("MyToken", accounts => {
  let token;

  beforeEach(async () => {
    token = await MyToken.deployed();
  });

  it("should allow owner to mint", async function() {
    const owner = accounts[0];
    const to = accounts[1];
    const amount = 1000;

    await token.mint(to, amount, { from: owner });

    const balanceOfTo = await token.balanceOf(to);
    assert.equal(balanceOfTo, amount, "The balance of the 'to' address was not updated correctly");
  });

  it("should allow the owner to burn tokens", async () => {
    const from = accounts[1];
    const amount = 100;

    const initialBalance = await token.balanceOf(from);
    await token.burn(from, amount, { from: accounts[0] });
    const finalBalance = await token.balanceOf(from);

    assert.equal(initialBalance.sub(finalBalance), amount, "The token balance was not burned correctly");
  });  

  it("should not allow non-owner to mint", async function() {
    const notOwner = accounts[1];
    const to = accounts[2];
    const amount = 100;

    try {
      await token.mint(to, amount, { from: notOwner });
      assert.fail("Expected an error but did not get one");
    } catch (error) {
      assert.include(error.message, "revert", "Expected 'revert' but got '" + error.message + "'");
    }
  });

  it("should fail with invalid emergency address", async function() {
    await token.setEmergencyAddress('0x0000000000000000000000000000000000000000', { from: accounts[0] });

    try {
      await token.transferEmergency({ from: accounts[0] });
      assert.fail("Expected an error but did not get one");
    } catch (error) {
      assert.include(error.message, "revert", "Expected 'revert' but got '" + error.message + "'");
    }
  });

  it("should set emergency address correctly", async function() {
    const emergencyAddress = accounts[1];

    await token.setEmergencyAddress(emergencyAddress, { from: accounts[0] });

    const storedEmergencyAddress = await token._emergencyAddresses(accounts[0]);
    assert.equal(storedEmergencyAddress, emergencyAddress, "The emergency address was not set correctly");
  });
  
  it("should fail with insufficient balance", async function() {
    await token.mint(accounts[0], 0, { from: accounts[0] });

    try {
      await token.transferEmergency({ from: accounts[0] });
      assert.fail("Expected an error but did not get one");
    } catch (error) {
      assert.include(error.message, "revert", "Expected 'revert' but got '" + error.message + "'");
    }
  });

  it("should fail with insufficient allowance", async function() {
    try {
      await token.transferFrom(accounts[0], accounts[1], 100, { from: accounts[2] });
      assert.fail("Expected an error but did not get one");
    } catch (error) {
      assert.include(error.message, "revert ERC20: insufficient allowance", "Expected 'revert ERC20: insufficient allowance' but got '" + error.message + "'");
    }
  });

  // TODO: 
  // Add test for transferEmergency with valid signature using @metamask/eth-sig-util
  // Add test for transferEmergency with invalid signature using @metamask/eth-sig-util

});