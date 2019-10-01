import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router';
import Layout from '../../components/Layout'
import UserContext from '../../components/UserContext';
import InstallationDetail from '../../components/InstallationDetail';
import { getInstallationByName } from '../../utils/query'

export default (props) => {
  const { user } = useContext(UserContext)
  const [installation, setInstallation] = useState()
  const [error, setError] = useState()
  const router = useRouter()

  useEffect(()=>{
    if(!router.query.name) return
    if(!user) return
    getInstallationByName({jwt: user.jwt, name: router.query.name})
      .then(i=>i ? setInstallation(i) : setError(`${router.query.name} org not found`))
  }, [user, router])

  return (
    <Layout>
      {installation && <InstallationDetail {...installation} />}
      {error && <h3>{error}</h3>}
    </Layout>
  );
}
