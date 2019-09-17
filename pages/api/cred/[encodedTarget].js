const hash = require('hash.js')
const { readFile, readdir } = require('fs-extra')
const base64url = require("base64url")
// const { boss, COLLECT_CRED_QUEUE } = require('../../../server/queue')

export default async(req, res) => {
  const encodedTarget = req.query['encodedTarget']
  const target = base64url.decode(encodedTarget)
  const githubToken = req.query['githubToken']
  let resData

  console.log(target, encodedTarget, githubToken)

  try {
    resData = {data: await collateCred(encodedTarget)}
  } catch(e){
    console.log(e)
    let job = await req.runner.addJob('collectCred', {target, githubToken})
    // let job = await boss.publishOnce(COLLECT_CRED_QUEUE, {target, githubToken}, null, target)
    resData = {job, data: null}
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(resData))
}

async function collateCred(encodedTarget){
  const cred = JSON.parse(await readFile(`${process.env.SOURCECRED_OUTPUT}/projects/${encodedTarget}/cred.json`))
  // console.log("cred", cred)
  const credMap = {}
  const addressToCred = cred[1].credJSON.addressToCred
  for (let user in addressToCred){
    let nameArr = user.split('\0')
    if(!nameArr.includes('USER')) continue
    let name = nameArr[nameArr.length-2]
    credMap[name] = addressToCred[user].reduce((a, b) => a + b, 0)
  }
  // console.log("credMap", credMap)
  return Object.keys(credMap).map(u=>({name: u, cred: credMap[u]}))
}
