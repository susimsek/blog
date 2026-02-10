import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AUTHOR_NAME, AVATAR_LINK, CONTACT_LINKS } from '@/config/constants';

export default function PostAuthorBox() {
  const { t } = useTranslation('post');

  return (
    <section className="post-author-box mt-5" aria-label={t('post.authorBox.title')}>
      <div className="post-author-avatar">
        <Image src={AVATAR_LINK} alt={AUTHOR_NAME} width={88} height={88} className="rounded-circle" />
      </div>

      <div className="post-author-content">
        <p className="post-author-eyebrow text-muted mb-1">{t('post.authorBox.title')}</p>
        <h2 className="h5 fw-bold mb-2">{AUTHOR_NAME}</h2>
        <p className="mb-3">{t('post.authorBox.bio')}</p>

        <p className="post-author-meta-label text-muted mb-2">{t('post.authorBox.expertiseTitle')}</p>
        <ul className="post-author-expertise list-unstyled d-flex flex-wrap gap-2 mb-3">
          <li className="post-author-skill">{t('post.authorBox.expertise.spring')}</li>
          <li className="post-author-skill">{t('post.authorBox.expertise.go')}</li>
          <li className="post-author-skill">{t('post.authorBox.expertise.microservices')}</li>
          <li className="post-author-skill">{t('post.authorBox.expertise.nextjs')}</li>
          <li className="post-author-skill">{t('post.authorBox.expertise.cloud')}</li>
        </ul>

        <p className="post-author-meta-label text-muted mb-2">{t('post.authorBox.connectTitle')}</p>
        <div className="post-author-links d-flex flex-wrap gap-3">
          <a href={CONTACT_LINKS.github} target="_blank" rel="noopener noreferrer" className="post-author-link">
            <FontAwesomeIcon icon={['fab', 'github']} />
            <span>{t('post.authorBox.links.github')}</span>
          </a>
          <a href={CONTACT_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="post-author-link">
            <FontAwesomeIcon icon={['fab', 'linkedin']} />
            <span>{t('post.authorBox.links.linkedin')}</span>
          </a>
          <a href={CONTACT_LINKS.medium} target="_blank" rel="noopener noreferrer" className="post-author-link">
            <FontAwesomeIcon icon={['fab', 'medium']} />
            <span>{t('post.authorBox.links.medium')}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
