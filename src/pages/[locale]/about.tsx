// pages/[locale]/about.tsx
import React from 'react';
import { Container, Card } from 'react-bootstrap';
import Head from 'next/head';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { AUTHOR_NAME, AVATAR_LINK, EXPERIENCE_START_YEAR } from '@/config/constants';
import { getStaticPaths } from '@/lib/getStatic';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import { makePostProps } from '@/lib/posts';
import { PostSummary, Topic } from '@/types/posts';

type AboutProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function About({ posts, topics }: Readonly<AboutProps>) {
  const { t } = useTranslation(['about']);

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <Head>
        <title>{t('about.meta.title')}</title>
        <meta name="description" content={t('about.meta.description')} />
        <meta name="keywords" content={t('about.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
      </Head>
      <Container className="py-5" style={{ maxWidth: '800px' }}>
        <h1 className="fw-bold mb-4">{t('about.header')}</h1>
        <Card>
          <Container>
            <Card.Body className="px-0">
              <div className="mb-3 text-center">
                <Image src={AVATAR_LINK} alt="Şuayb Şimşek" width={150} height={150} className="rounded-circle" />
              </div>
              <Card.Text className="fs-5">
                {t('about.description', { experienceYears: new Date().getFullYear() - EXPERIENCE_START_YEAR })}
              </Card.Text>
              <hr />
              <h2 className="fw-bold mt-4">{t('about.findMeOnline')}</h2>
              <ContactInfo />
            </Card.Body>
          </Container>
        </Card>
      </Container>
    </Layout>
  );
}

const getStaticProps = makePostProps(['common', 'about']);

export { getStaticPaths, getStaticProps };
