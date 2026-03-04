// components/common/Loading.tsx
import React from 'react';
import Container from 'react-bootstrap/Container';
import { useTranslation } from 'react-i18next';
import AdminLoadingState from '@/components/admin/AdminLoadingState';

const Loading: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <Container className="loading-screen d-flex justify-content-center align-items-center">
      <AdminLoadingState className="admin-loading-stack" ariaLabel={t('common.status.loading')} />
    </Container>
  );
};

export default Loading;
