const { readFile } = require('fs-extra')
const base64url = require("base64url")
const { userJWT, adminJWT } = require("./jwt")
const { collateCred } = require("../utils")
const { getInstallationByDAO, getContributorAddress } = require("../utils/query")
const merklize = require('../utils/merklize')

module.exports = async (req, res)=>{
  // const u = req.session.user
  const target = req.query.target
  const start = req.query.start
  const dao = req.query.dao

  const installation = await getInstallationByDAO({jwt: adminJWT, dao})
  const raw = JSON.parse(await readFile(`${process.env.SOURCECRED_OUTPUT}/projects/${base64url.encode(target)}/cred.json`))
  const diff = collateCred({raw, start})
  console.log("diff", diff)
  // map to addresses
  const addressed = await Promise.all(diff.cred.map(
    async ({username, points})=>({
      username,
      address: await getContributorAddress({
        jwt: adminJWT,
        username,
        installationId: installation.id
      }),
      points
    })
  ))

  const data = merklize(addressed)
  data.interval = { start: diff.start, end: diff.end }
  data.supplement = { usernames: addressed.map(({address, username})=>({address, username})) }
  console.log("data", data)

  let added = await req.ipfs.add(Buffer.from(JSON.stringify(data), 'utf8'))
  let hash = added[0].hash

  res.json({hash, data})

  // try {
  // } catch(e){
  //   res.boom.badImplementation('terrible implementation', e)
  // }
}
