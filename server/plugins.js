const { makeWrapResolversPlugin } = require("graphile-utils")
const { toChecksumAddress } = require('ethereum-checksum-address')
const { privateToAddress } = require('ethereumjs-util')

const ProtectAutoKeyPlugin = makeWrapResolversPlugin({
  Contributor: {
    autoAddress(resolve, source, args, context, resolveInfo) {
      if(source.autoKey)
        return toChecksumAddress(`0x${privateToAddress(source.autoKey).toString('hex')}`)
      return null
    },
    async autoKey(resolve, source, args, context, resolveInfo) {
      const requesterId = context.jwtClaims.user_id
      if(context.jwtClaims.role === "admin_role" || (requesterId && requesterId === source.userId))
        return await resolve()
      return null
    }
  }
});

module.exports = {
  ProtectAutoKeyPlugin
}
