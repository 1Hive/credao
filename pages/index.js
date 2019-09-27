import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import Loading from '../components/Loading'
import Layout from '../components/Layout'
import DAOLink from '../components/DAOLink'
import UserContext from '../components/UserContext';
import { collateCred } from '../utils'
import { create as createDAO, getAirdropper, airdrop } from '../utils/dao'
import { getUserInstallationsByUserId } from '../utils/query'
import ipfsClient from 'ipfs-http-client'

const Index = (props) => {
  const { user } = useContext(UserContext)
  const [installations, setInstallations] = useState()

  useEffect(()=>{
    if(!user) return
    (async ()=>{
      setInstallations( await getUserInstallationsByUserId({jwt: user.jwt, id: user.id}) )
    })()
  }, [user])

  return (
    <Layout>
      <p>{user ? `Welcome, ${user.username}` : `please login`}</p>
      {installations && installations.length ?
        <React.Fragment>
          <p>Your organizations:</p>
          <table>
            <tbody>
              {installations.map(i=>(
                <tr key={i.id}>
                  <td><Link href='/org/[name]' as={`/org/${i.name}`}><a>{i.name}</a></Link></td>
                  <td>{i.dao ? <DAOLink dao={i.dao}>visit dao</DAOLink> : 'no dao'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </React.Fragment>
        : null
      }
    </Layout>
  )
}

export default Index
