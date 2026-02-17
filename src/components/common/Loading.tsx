// components/common/Loading.tsx
import React from 'react';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';

const Loading: React.FC = () => {
  return (
    <Container className="loading-screen d-flex justify-content-center align-items-center">
      <output>
        <Spinner animation="border" />
      </output>
    </Container>
  );
};

export default Loading;
