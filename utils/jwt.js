const { readFile } = require('fs-extra')
const jwt = require('jsonwebtoken')

module.exports.initJWT = async function(){
  const key = await readFile(process.env.KEY_PATH)
  setInterval(()=>{
    process.env["GITHUB_JWT"] = genJWT(key)
    console.log("NEW JWT:\n", process.env["GITHUB_JWT"])
  }, 9*60*1000)
  process.env["GITHUB_JWT"] = genJWT(key)
}

function genJWT(key){
  let nowSeconds = Math.round(new Date().getTime()/1000)
  return jwt.sign({
      iat: nowSeconds,
      exp: nowSeconds + (10 * 60),
      iss: process.env.GITHUB_APP_ID
  }, key, { algorithm: 'RS256'});
}
