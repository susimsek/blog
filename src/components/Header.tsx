import { Container, Navbar } from 'react-bootstrap';
import Link from 'next/link';

export default function Header() {
  return (
    <Navbar bg="light" expand="lg" className="border-bottom shadow-sm">
      <Container>
        <Navbar.Brand>
          <Link href="/" className="text-decoration-none">
            My Blog
          </Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <div className="ms-auto d-flex gap-3">
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/about" className="nav-link">
              About
            </Link>
            <Link href="/contact" className="nav-link">
              Contact
            </Link>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
