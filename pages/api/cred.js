export default (req, res) => {
  const repos = req.query["repos[]"].split(',')
  console.log(repos)
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(repos))
}
