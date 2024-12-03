// components/common/Loading.tsx
import React from 'react';
import { Container, Spinner } from 'react-bootstrap';

const Loading: React.FC = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <output>
        <Spinner animation="border" />
      </output>
    </Container>
  );
};

export default Loading;
