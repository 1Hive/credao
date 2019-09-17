const jsonwebtoken = require('jsonwebtoken')
const regenInterval = 9*60
let githubJWT, lastGen = 0, key

if(typeof window === "undefined")
  key = require('fs-extra').readFileSync(process.env.KEY_PATH)

module.exports = async function(){
  let nowSeconds = Math.round(new Date().getTime()/1000)
  if(!githubJWT || nowSeconds - lastGen > regenInterval){
    lastGen = nowSeconds
    githubJWT = jsonwebtoken.sign({
        iat: nowSeconds,
        exp: nowSeconds + (10 * 60),
        iss: process.env.GITHUB_APP_ID
    }, key, { algorithm: 'RS256'})
  }

  return githubJWT
}
