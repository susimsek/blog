import { Container, Navbar, Nav } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { assetPrefix } from '@/config/constants';

export default function Header() {
  return (
    <Navbar bg="light" expand="lg" className="border-bottom shadow-sm">
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
          <span className="ms-2 fw-bold" style={{ fontSize: '1.25rem' }}>
            My Blog
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto d-flex gap-3">
            <Nav.Link as={Link} href="/">
              Home
            </Nav.Link>
            <Nav.Link as={Link} href="/about">
              About
            </Nav.Link>
            <Nav.Link as={Link} href="/contact">
              Contact
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
