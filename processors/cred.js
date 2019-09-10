module.exports = function(job, done){
  // Do some heavy work
  console.log(job)

  // return Promise.resolve({cred: "results"});
  done(null, {cred: "results"})
}
