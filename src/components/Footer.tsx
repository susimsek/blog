// components/Footer.tsx
import { Container } from 'react-bootstrap';

export default function Footer() {
  return (
    <footer className="bg-light border-top py-3">
      <Container>
        <p className="text-center mb-0">© {new Date().getFullYear()} My Blog. All rights reserved.</p>
      </Container>
    </footer>
  );
}
