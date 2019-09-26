const jwt = require('jsonwebtoken')
const regenInterval = 9*60
const key = require('fs-extra').readFileSync(process.env.KEY_PATH)
let githubJWT, lastGen = 0

module.exports = {
  userJWT: id=>jwt.sign({ aud: "credao", role: "user_role", user_id: id}, process.env.JWT_SECRET, {}),
  adminJWT: jwt.sign({ aud: "credao", role: "admin_role", user_id: 0}, process.env.JWT_SECRET, {}),
  githubJWT: ()=>{
    let nowSeconds = Math.round(new Date().getTime()/1000)
    if(!githubJWT || nowSeconds - lastGen > regenInterval){
      lastGen = nowSeconds
      githubJWT = jwt.sign({
          iat: nowSeconds,
          exp: nowSeconds + (10 * 60),
          iss: process.env.GITHUB_APP_ID
      }, key, { algorithm: 'RS256'})
    }

    return githubJWT
  }
}
