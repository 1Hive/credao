const hash = require('hash.js')
const { readFile, readdir } = require('fs-extra')
const base64url = require("base64url")
const { COLLECT_CRED_QUEUE } = require('../../../utils/constants')
const { ethers } = require("ethers")
const { createInstallationUser, getInstallation, createUser } = require('../../../utils/query')

export default async(req, res) => {
  const installationId = req.query['installationId']

  const installation = await getInstallation({installationId})
  const target = installation.target//base64url.decode(encodedTarget)
  const encodedTarget = base64url.encode(target)//req.query['encodedTarget']
  const taskKey = `${target}@${new Date().toISOString().slice(0,10)}`
  const githubToken = req.query['githubToken']
  let resData

  console.log(target, encodedTarget, githubToken)

  try {
    let data = await collateCred(encodedTarget)
    console.log(Object.keys(data.credMap))
    data.cred = await Promise.all(Object.keys(data.credMap).map(async (username)=>{
      let points = data.credMap[username]
      const user = await createUser({username})
      const installationUser = await createInstallationUser({userId: user.id, installationId})
      const address = (new ethers.Wallet(installationUser.autoKey)).address
      return {username, address, points}
    }))
    delete data.credMap
    resData = {data}
  } catch(e){
    console.log(e)
    let job = await req.boss.publishOnce(COLLECT_CRED_QUEUE, {target, githubToken}, null, taskKey)
    resData = {job, data: null}
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(resData))
}

async function collateCred(encodedTarget){
  const data = JSON.parse(await readFile(`${process.env.SOURCECRED_OUTPUT}/projects/${encodedTarget}/cred.json`))
  // console.log(data)
  const credMap = {}
  const cred = data[1].credJSON
  for (let user in cred){
    let nameArr = user.split('\0')
    if(!nameArr.includes('USER')) continue
    let name = nameArr[nameArr.length-2]
    credMap[name] = cred[user].reduce((a, b) => a + b, 0)
  }

  let intervals = data[1].intervalsJSON
  return {
    credMap,
    start: intervals[0].startTimeMs,
    end: intervals[intervals.length - 1].endTimeMs
  }
}
