// components/common/Loading.tsx
import React from 'react';
import Container from 'react-bootstrap/Container';
import AdminLoadingState from '@/components/admin/AdminLoadingState';

type LoadingProps = {
  ariaLabel?: string;
};

const Loading: React.FC<LoadingProps> = ({ ariaLabel = 'Loading' }) => {
  return (
    <Container className="loading-screen d-flex justify-content-center align-items-center">
      <AdminLoadingState className="admin-loading-stack" ariaLabel={ariaLabel} />
    </Container>
  );
};

export default Loading;
