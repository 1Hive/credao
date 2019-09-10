import Link from 'next/link'
import UserNav from './UserNav'

const linkStyle = {
  marginRight: 15
};

const Header = () => (
  <div>
    <Link href="/">
      <a style={linkStyle}>home</a>
    </Link>
    <UserNav />
  </div>
);

export default Header;
