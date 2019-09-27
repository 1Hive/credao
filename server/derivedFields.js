const { toChecksumAddress } = require('ethereum-checksum-address')
const { privateToAddress } = require('ethereumjs-util')

module.exports = [
  {
    identifiers: ["public.installation_users.auto_key"],
    inflect: fieldName => `autoAddress`,
    resolve: privateKey => toChecksumAddress(`0x${privateToAddress(privateKey).toString('hex')}`)
  }
]
