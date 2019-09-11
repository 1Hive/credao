const Queue = require('bull');
const credQueue = new Queue('collect cred');
credQueue.process(`${process.env.PWD}/processors/cred.js`)

credQueue.on('completed', function(job, result){
  console.log('completed', job.id, result)
  // Job completed with output result!
})

export default async(req, res) => {
  const id = req.query["id"]

  let job = await credQueue.add({id}, {jobId: `cred:${id}`})

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(job))
}
