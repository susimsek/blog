import { Container, Navbar, Nav } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { assetPrefix } from '@/config/constants';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '@/reducers/theme';
import { RootState } from '@/config/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Header() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);

  return (
    <Navbar expand="lg" className="border-bottom shadow-sm">
      <Container>
        <Navbar.Brand as={Link} href="/" className="d-flex align-items-center text-decoration-none">
          <Image
            src={`${assetPrefix}/images/logo.png`}
            alt="My Blog Logo"
            width={40}
            height={40}
            priority
            className="rounded-circle"
          />
          <span className={`ms-2 fw-bold `} style={{ fontSize: '1.25rem' }}>
            My Blog
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav">
          <FontAwesomeIcon icon="bars" className="navbar-toggler-icon" />
        </Navbar.Toggle>
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto d-flex gap-3 align-items-center">
            <Nav.Link as={Link} href="/">
              Home
            </Nav.Link>
            <Nav.Link as={Link} href="/about">
              About
            </Nav.Link>
            <Nav.Link as={Link} href="/contact">
              Contact
            </Nav.Link>
            <button
              className={`btn theme-toggle-btn d-flex align-items-center gap-2 ${theme}`}
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle Theme"
            >
              <FontAwesomeIcon icon={theme === 'light' ? 'moon' : 'sun'} />
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
