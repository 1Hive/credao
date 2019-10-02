/* global artifacts */
var Distribution = artifacts.require('Distribution.sol')

module.exports = function(deployer) {
  deployer.deploy(Distribution)
}
