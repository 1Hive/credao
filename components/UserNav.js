import React from 'react'
import PropTypes from 'prop-types'
import Link from 'next/link'

const signOutLink = (
  <Link href='/sign-out'>
    <a className='sign-out'>sign out</a>
  </Link>
)

const UserNav = (props, { github }) => {
  return (
    github.user
      ? <React.Fragment>hi {github.user.login} ({signOutLink})</React.Fragment>
      : <Link href='/sign-in'><a className='sign-in'>sign in</a></Link>
  )
}

UserNav.contextTypes = {
  github: PropTypes.shape({
    user: PropTypes.shape({
      login: PropTypes.string
    })
  })
}

export default UserNav
