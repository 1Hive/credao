import Link from 'next/link'

const LogIn = props => {
  return (
    <Link href='/sign-in'>
      <a>sign in</a>
    </Link>
  )
}

const LogOut = props => {
  return (
    <Link href='/sign-out'>
      <a>sign out</a>
    </Link>
  )
}

const linkStyle = {
  marginRight: 15
};

const Header = props => {
  return props.user ? <LogOut /> : <LogIn />
}

export default Header;
