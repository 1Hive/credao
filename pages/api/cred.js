var Queue = require('bull');
const credQueue = new Queue('collect cred');

credQueue.process(`/home/carl/Projects/credao/processors/cred.js`)

credQueue
  .on('completed', function(job, result){
    console.log(job.id, result)
    // Job completed with output result!
})

export default async(req, res) => {
  const repos = req.query["repos[]"].split(',').sort()

  credQueue.add({repos})

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify({status: "started", repos}))
}
