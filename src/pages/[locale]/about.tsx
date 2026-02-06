import React from 'react';
import { Container, Card } from 'react-bootstrap';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { AUTHOR_NAME, AVATAR_LINK, CONTACT_LINKS, EXPERIENCE_START_YEAR, SITE_URL } from '@/config/constants';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import { makePostProps } from '@/lib/posts';
import { PostSummary, Topic } from '@/types/posts';
import Seo from '@/components/common/SEO';

type AboutProps = {
  layoutPosts: PostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

export default function About({ layoutPosts, topics, preFooterTopTopics }: Readonly<AboutProps>) {
  const { t } = useTranslation(['about']);

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    image: `${SITE_URL}${AVATAR_LINK}`,
    jobTitle: t('about.jobTitle'),
    email: CONTACT_LINKS.email,
    sameAs: [CONTACT_LINKS.linkedin, CONTACT_LINKS.medium, CONTACT_LINKS.github],
    gender: 'male',
    nationality: 'Turkish',
  };

  const profileData = { first_name: 'Şuayb', last_name: 'Şimşek' };

  return (
    <Layout
      posts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
      searchEnabled={true}
      sidebarEnabled={true}
    >
      <Seo
        title={t('about.title')}
        ogTitle={t('about.meta.title')}
        description={t('about.meta.description')}
        keywords={t('about.meta.keywords')}
        image={AVATAR_LINK}
        type="profile"
        path="/about"
        profile={profileData}
        jsonLd={jsonLdData}
      />
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

export const getStaticProps = makePostProps(['common', 'about'], { includePosts: false });
export { getStaticPaths } from '@/lib/getStatic';
