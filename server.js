// This file doesn't go through babel or webpack transformation.
// Make sure the syntax and sources this file requires are compatible with the current node version you are running
// See https://github.com/zeit/next.js/issues/1245 for discussions on Universal Webpack or universal Babel
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initJWT } = require('./utils/jwt')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

main()

async function main(){
  await initJWT()
  await app.prepare()
  createServer((req, res) => {
    handle(req, res, parse(req.url, true))
  }).listen(4000, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:4000')
  })
}
