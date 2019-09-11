import React, { useState, useEffect } from 'react'
import fetch from 'isomorphic-unfetch';

const Cred = props =>
  <React.Fragment>
    <dt>{props.name}</dt>
    <dd>{props.cred}</dd>
  </React.Fragment>

const credBox = {
  margin: "0 20px",
  maxHeight: "50vh",
  overflowY: "auto",
  maxWidth: "25%",
  minWidth: "300px"
}

const CredList = ({ repos }) => {
  const [creds, setCreds] = useState([])
  useEffect(()=>{
    console.log(repos)
    let credMap = repos.reduce((prev, curr)=>{
      for (let user in curr.cred[1].credJSON.addressToCred){
        // if(user.includes("REPO")) continue
        let nameArr = user.split("\0")
        if(!nameArr.includes("USER")) continue
        console.log(nameArr)
        let name = nameArr[nameArr.length-2]
        console.log(name)
        if(!prev[name]) prev[name] = 0
        prev[name] += curr.cred[1].credJSON.addressToCred[user].reduce((a, b) => a + b, 0)
      }
      return prev
    }, {})
    let credArr = Object.keys(credMap).map(u=>({name: u, cred: credMap[u]}))
    setCreds(credArr.sort((a,b)=>b.cred-a.cred))
  }, [repos])

  return (
    <dl style={credBox}>
      {creds.map(c=><Cred key={c.name} {...c} />)}
    </dl>
  )
}

export default CredList
