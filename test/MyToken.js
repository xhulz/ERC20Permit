const MyToken = artifacts.require("./MyToken.sol");

const { expectRevert } =  require('@openzeppelin/test-helpers');
const {setSignature, getDigest} =  require('../utils/signature');

contract("MyToken", accounts => {
  // YOU NEED TO PUT THE OWNER PRIVATE KEY HERE, TO SIGN THE PERMIT
  const ownerPrivateKey = Buffer.from('39f3c3220f1cca5d72e53aba4915adf8df91c850545e2bcde409485250ed1bcd', 'hex');
  const chainId = 1;

  let token;
  let name;

  beforeEach(async () => {
    token = await MyToken.deployed();
    name = await token.name();
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
    const emergencyAddress = accounts[2];

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

  it('should permits and emits approval', async () => {
    const [owner, spender] = accounts;
  
    // Mints some tokens to the owner
    await token.mint(owner, 1000, { from: owner });

    // Creates the approval request
    const approve = {
      owner: owner,
      spender: spender,
      value: '100'
    };
  
    const deadline = '100000000000000';
    const nonce = '0';
  
    // Gets the EIP712 digest
    const digest = getDigest(name, token.address, chainId, approve, nonce, deadline);
  
    // Signs it
    const { v, r, s } = setSignature(digest, ownerPrivateKey);
  
    // Approves it
    const receipt = await token.setPermission(approve.owner, approve.spender, approve.value, deadline, v, r, s);
    const event = receipt.logs[0];
  
    // Tests the approval
    assert.equal(event.event, 'Approval');
    assert.equal(await token.nonces(owner), 1);
    assert.equal(await token.allowance(approve.owner, approve.spender), approve.value);
  
    // Re-using the same sig doesn't work for replay-protection
    await expectRevert(
      token.permit(approve.owner, approve.spender, approve.value, deadline, v, r, s),
      'ERC20Permit: invalid signature'
    )
  
    // Invalid ecrecover's return address(0x0), this case must fail
    await expectRevert(
      token.permit(
        '0x0000000000000000000000000000000000000000',
        approve.spender,
        approve.value,
        deadline,
        '0x99',
        r,
        s
      ),
      'VM Exception while processing transaction: revert ECDSA: invalid signature'
    )
  });

  it("should transfer the sender's tokens to the emergency address", async () => {
    const [owner, spender] = accounts;

    // Get the initial balance of the sender and the recipient
    const initialOwnerBalance = await token.balanceOf(owner);
    const initialEmergencyBalance = await token.balanceOf(await token._emergencyAddresses(owner));

    // Get spender allowance
    const spenderAllowance = await await token._spenderAllowance(spender);

    // // Call the transferEmergency function
    const result = await token.transferEmergency({ from: spender });
    assert.equal(result.logs[0].event, "Approval");

    // Get the updated balance of the sender and the recipient
    const updatedOwnerBalance = await token.balanceOf(owner);
    const updatedEmergencyBalance = await token.balanceOf(await token._emergencyAddresses(owner));

    // Check if the tokens were transferred correctly
    assert.equal(initialOwnerBalance.toNumber(), 1000);
    assert.equal(initialEmergencyBalance.toNumber(), 0);
    assert.equal(updatedOwnerBalance.toNumber(), initialOwnerBalance.toNumber() - spenderAllowance.toNumber());
    assert.equal(updatedEmergencyBalance.toNumber(), spenderAllowance.toNumber());
  });  
});