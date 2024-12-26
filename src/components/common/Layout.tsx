import { ReactNode } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Container } from 'react-bootstrap';
import { PostSummary, Topic } from '@/types/posts';

type LayoutProps = {
  children: ReactNode;
  posts?: PostSummary[];
  topics?: Topic[];
  searchEnabled?: boolean;
};

export default function Layout({ children, posts = [], searchEnabled = false }: Readonly<LayoutProps>) {
  return (
    <>
      <Header posts={posts} searchEnabled={searchEnabled} />
      <main>
        <Container className="py-5">{children}</Container>
      </main>
      <Footer />
    </>
  );
}
