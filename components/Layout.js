import { Box, Grommet } from 'grommet';
import Header from './Header';

const layoutStyle = {
  margin: 20,
  padding: 20,
  border: '1px solid #DDD'
};

const theme = {
  heading: {
    weight: 500
  },
  global: {
    font: {
      family: 'Roboto',
      size: '14px',
      height: '20px',
    }
  },
};

const Layout = props => (
  <Grommet theme={theme}>
    <style jsx global>{`
      body { margin: 0; }
    `}</style>
    <Box fill={true}>
      <Header />
      <Box direction='row' flex overflow={{ horizontal: 'hidden' }}>
        <Box flex align='center' justify='center'>
          {props.children}
        </Box>
      </Box>
    </Box>
  </Grommet>
);

export default Layout;
