const Queue = require('bull');
const { readFile, readdir } = require('fs-extra')
const credQueue = new Queue('collect cred');
credQueue.process(`${process.env.PWD}/processors/cred.js`)
const STARTED = "started"
const COMPLETED = "completed"
const FAILED = "failed"

const credJobs = {}

credQueue.on('completed', function(job, result){
  console.log('completed', job.id, result)
  delete getKeyByValue(credJobs, job.id)
})

credQueue.on('failed', function(job, err){
  console.log('failed', job.id, err)
  delete getKeyByValue(credJobs, job.id)
})

export default async(req, res) => {
  const id = req.query["id"]
  console.log(id)
  const githubToken = req.cookies["githubAccessToken"]
  let resData

  // check if has active job
  if(credJobs[id])
    resData = {status: STARTED, data: null}
  else {
    try {
      let dir = await readdir(`${process.env.REPO_DIR}/${id}/projects`)
      let data = JSON.parse(await readFile(`${process.env.REPO_DIR}/${id}/projects/${dir[0]}/cred.json`))
      resData = {status: COMPLETED, data}
    } catch(e){
      let job = await credQueue.add({id, githubToken})
      credJobs[id] = job.id
      resData = {status: STARTED, data: null}
    }
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(resData))
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}
