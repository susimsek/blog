// components/common/Layout.tsx
import { ReactNode } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
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
