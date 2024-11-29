// components/Layout.tsx
import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Container } from 'react-bootstrap';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main>
        <Container className="py-5">{children}</Container>
      </main>
      <Footer />
    </>
  );
}
