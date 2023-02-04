// const HelloBlockchain = artifacts.require("HelloBlockchain");
const MyToken = artifacts.require("MyToken");

module.exports = function (deployer) {
  deployer.deploy(MyToken);
};