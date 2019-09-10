import { PublicPage } from 'next-github-auth'
import Layout from '../components/Layout';
import Link from 'next/link';

const Index = (props) =>
  <Layout>
    <p>This is the home page</p>
    <Link href="/start">
      <button>Start here</button>
    </Link>
  </Layout>

export default PublicPage(Index)
