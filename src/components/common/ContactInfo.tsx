// components/common/ContactInfo.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { CONTACT_LINKS, SOCIAL_MEDIA_NAMES } from '@/config/constants';

const ContactInfo = () => {
  const { t } = useTranslation('common');

  return (
    <ul className="list-unstyled fs-5 mt-3">
      <li className="mb-3">
        <FontAwesomeIcon icon="envelope" className="me-2 email-logo" />
        <strong>{t('common.contactInfo.email')}:</strong>{' '}
        <a href={`mailto:${CONTACT_LINKS.email}`} className="text-decoration-none">
          {CONTACT_LINKS.email}
        </a>
      </li>
      <li className="mb-3">
        <FontAwesomeIcon icon={['fab', 'linkedin']} className="me-2 linkedin-brand-logo" />
        <strong>{SOCIAL_MEDIA_NAMES.linkedin}:</strong>{' '}
        <a href={CONTACT_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
          {CONTACT_LINKS.linkedin}
        </a>
      </li>
      <li className="mb-3">
        <FontAwesomeIcon icon={['fab', 'medium']} className="me-2 medium-brand-logo" />
        <strong>{SOCIAL_MEDIA_NAMES.medium}:</strong>{' '}
        <a href={CONTACT_LINKS.medium} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
          {CONTACT_LINKS.medium}
        </a>
      </li>
      <li className="mb-3">
        <FontAwesomeIcon icon={['fab', 'github']} className="me-2 github-brand-logo" />
        <strong>{SOCIAL_MEDIA_NAMES.github}:</strong>{' '}
        <a href={CONTACT_LINKS.github} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
          {CONTACT_LINKS.github}
        </a>
      </li>
    </ul>
  );
};

export default ContactInfo;
