const hash = require('hash.js')
const Queue = require('bull');
const { readFile, readdir } = require('fs-extra')
const credQueue = new Queue('collect cred');
const md5 = require('md5');
credQueue.process(`${process.env.PWD}/processors/cred.js`)
const STARTED = "started"
const COMPLETED = "completed"
const FAILED = "failed"

credQueue.on(COMPLETED, function(job, result){
  console.log(COMPLETED, job.id, result)
})

credQueue.on(FAILED, function(job, err){
  console.log(FAILED, job.id, err)
})

export default async(req, res) => {
  const id = req.query["id"]
  const repos = req.query["repos"].split(",")
  const hash = md5(repos.join(""))
  const githubToken = req.cookies["githubToken"]
  let resData

  try {
    resData = {data: await collateCred(id, hash)}
  } catch(e){
    // console.log(e)
    let job = await credQueue.add({id, repos, hash, githubToken})
    resData = {job, data: null}
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(resData))
}

async function collateCred(id, hash){
  // const dir = await readdir(`${process.env.REPO_DIR}/${id}/projects`)
  const dir = await readdir(`${process.env.REPO_DIR}/${hash}/projects`)
  const rawCreds = (await Promise.all(
    dir.map(async d=>await readFile(`${process.env.REPO_DIR}/${hash}/projects/${d}/cred.json`))
  )).map(JSON.parse)
  const credMap = rawCreds.reduce((prev,curr)=>{
    const addressToCred = curr[1].credJSON.addressToCred
    for (let user in addressToCred){
      let nameArr = user.split("\0")
      if(!nameArr.includes("USER")) continue
      let name = nameArr[nameArr.length-2]
      if(!prev[name]) prev[name] = 0
      prev[name] += addressToCred[user].reduce((a, b) => a + b, 0)
    }
    return prev
  }, {})
  return Object.keys(credMap).map(u=>({name: u, cred: credMap[u]}))
}
