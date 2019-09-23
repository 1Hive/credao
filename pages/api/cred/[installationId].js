const hash = require('hash.js')
const { readFile, readdir } = require('fs-extra')
const base64url = require("base64url")
const { COLLECT_CRED_QUEUE } = require('../../../utils/constants')
const { ethers } = require("ethers")
const {
  getUserByUsername,
  getInstallationUser,
  createInstallationUser,
  getInstallationById,
  createUser
} = require('../../../utils/query')

export default async(req, res) => {
  const installationId = req.query['installationId']
  const after = parseInt(req.query['after'])
  console.log("after", after)

  const installation = await getInstallationById({installationId})
  const target = installation.target//base64url.decode(encodedTarget)
  const encodedTarget = base64url.encode(target)//req.query['encodedTarget']
  const taskKey = `${target}@${new Date().toISOString().slice(0,10)}`
  const githubToken = req.query['githubToken']
  let resData

  console.log(target, encodedTarget, githubToken)

  let job = await req.boss.publishOnce(COLLECT_CRED_QUEUE, {target, githubToken}, null, taskKey)

  try {
    let data = await collateCred(encodedTarget, after)
    data.cred = await Promise.all(data.cred.map(getAddressAttacher(installationId)))
    resData = {data}
  } catch(e){
    console.log(e)
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(resData))
}

async function collateCred(encodedTarget, after){
  const data = JSON.parse(await readFile(`${process.env.SOURCECRED_OUTPUT}/projects/${encodedTarget}/cred.json`))
  let startIdx = 0
  if(after){
    // after = 1566691200000
    startIdx = data[1].intervalsJSON.findIndex(interval=>interval.startTimeMs >= after)
    if(startIdx === -1) return {cred: []}
  }

  console.log("startIdx", startIdx)
  const credMap = {}
  const cred = data[1].credJSON
  for (let user in cred){
    let nameArr = user.split('\0')
    if(!nameArr.includes('USER')) continue
    let name = nameArr[nameArr.length-2]
    credMap[name] = cred[user].slice(startIdx).reduce((a, b) => a + b, 0)
  }

  let intervals = data[1].intervalsJSON
  return {
    cred: Object.keys(credMap).map(username=>({username, points: credMap[username]})),
    start: intervals[startIdx].startTimeMs,
    end: intervals[intervals.length - 1].endTimeMs
  }
}

function getAddressAttacher(installationId){
  return async function(cred){
    let user = await getUserByUsername({username: cred.username})
    if(!user) user = await createUser({username: cred.username})

    let installationUser = await getInstallationUser({userId: user.id, installationId})
    if(!installationUser) installationUser = await createInstallationUser({userId: user.id, installationId})

    const address = (new ethers.Wallet(installationUser.autoKey)).address
    return {...cred, address}
  }
}
