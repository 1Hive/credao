import BN from 'bn.js';
const DECIMALS = (new BN(10)).pow(new BN(18))
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const EMPTY_CALLSCRIPT = '0x00000001'

function decimalize(amount){
  return (new BN(amount)).mul(DECIMALS)
}

function dedecimalize(amount){
  return (new BN(amount)).div(DECIMALS)
}

function collateCred({raw, after}){
  let startIdx = 0
  if(after){
    // after = 1566691200000
    startIdx = raw[1].intervalsJSON.findIndex(interval=>interval.startTimeMs >= after)
    if(startIdx === -1) return null
  }

  console.log("startIdx", startIdx)

  const cred = []
  for (let user in raw[1].credJSON){
    let nameArr = user.split('\0')
    if(!nameArr.includes('USER')) continue
    let username = nameArr[nameArr.length-2]
    cred.push({username, points: raw[1].credJSON[user].slice(startIdx).reduce((a, b) => a + b, 0)})
  }

  let intervals = raw[1].intervalsJSON

  return {
    cred,
    start: intervals[startIdx].startTimeMs,
    end: intervals[intervals.length - 1].endTimeMs
  }
}

export {
  collateCred,
  decimalize,
  dedecimalize,
  NULL_ADDRESS,
  EMPTY_CALLSCRIPT
}
