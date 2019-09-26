import React from 'react'
import App from 'next/app'
import UserContext from '../components/UserContext'
import fetch from 'isomorphic-unfetch'

class CredaoApp extends App {

  state = {
    user: null
  }

  componentDidMount = async () => {
    // const urlParams = new URLSearchParams(window.location.search)
    let res = await fetch(`/auth${window.location.search}`)
    const user = await res.json()
    if (user) this.setState({user})
  }

  render() {
    const { Component, pageProps } = this.props
    const { user } = this.state

    return (
      <UserContext.Provider value={{ user }}>
        <Component {...pageProps} />
      </UserContext.Provider>
    )
  }

}

export default CredaoApp
