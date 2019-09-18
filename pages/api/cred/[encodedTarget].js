const hash = require('hash.js')
const { readFile, readdir } = require('fs-extra')
const base64url = require("base64url")
const { COLLECT_CRED_QUEUE } = require('../../../utils/constants')

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
    let job = await req.boss.publishOnce(COLLECT_CRED_QUEUE, {target, githubToken}, null, target)
    resData = {job, data: null}
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(resData))
}

async function collateCred(encodedTarget){
  const data = JSON.parse(await readFile(`${process.env.SOURCECRED_OUTPUT}/projects/${encodedTarget}/cred.json`))
  const credMap = {}
  const cred = data[1].credJSON
  for (let user in cred){
    let nameArr = user.split('\0')
    if(!nameArr.includes('USER')) continue
    let name = nameArr[nameArr.length-2]
    credMap[name] = cred[user].reduce((a, b) => a + b, 0)
  }
  return Object.keys(credMap).map(u=>({name: u, cred: credMap[u]}))
}
