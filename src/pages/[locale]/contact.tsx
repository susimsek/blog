import React from 'react';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';
import { AUTHOR_NAME, AVATAR_LINK, CONTACT_LINKS, SITE_URL } from '@/config/constants';
import { getStaticPaths } from '@/lib/getStatic';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import { makePostProps } from '@/lib/posts';
import { PostSummary, Topic } from '@/types/posts';
import SEO from '@/components/common/SEO';

type ContactProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function Contact({ posts, topics }: Readonly<ContactProps>) {
  const { t } = useTranslation(['contact']);

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: t('contact.meta.title'),
    description: t('contact.meta.description'),
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
      image: `${SITE_URL}${AVATAR_LINK}`,
      jobTitle: t('contact.jobTitle'),
      email: CONTACT_LINKS.email,
      sameAs: [CONTACT_LINKS.linkedin, CONTACT_LINKS.medium, CONTACT_LINKS.github],
      gender: 'male',
      nationality: 'Turkish',
    },
  };

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <SEO
        title={t('contact.title')}
        ogTitle={t('contact.meta.title')}
        description={t('contact.meta.description')}
        keywords={t('contact.meta.keywords')}
        image={AVATAR_LINK}
        type="website"
        path="/contact"
        jsonLd={jsonLdData}
      />
      <Container className="py-5" style={{ maxWidth: '800px' }}>
        <h1 className="fw-bold mb-4">{t('contact.header')}</h1>
        <p className="fs-5">{t('contact.description')}</p>
        <h2 className="fw-bold mt-4">{t('contact.title')}</h2>
        <ContactInfo />
      </Container>
    </Layout>
  );
}

const getStaticProps = makePostProps(['common', 'contact']);

export { getStaticPaths, getStaticProps };
