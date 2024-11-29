import { Container } from 'react-bootstrap';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function About() {
  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      <h1 className="fw-bold mb-4">About Me</h1>
      <p className="fs-5">
        Hi, I’m Şuayb Şimşek, a passionate backend and fullstack developer from Turkey. I graduated in Computer
        Engineering from TOBB University of Economics and Technology. Over the past 5 years, I have gained extensive
        experience in backend, frontend, blockchain, and DevOps technologies.
      </p>
      <h2 className="fw-bold mt-4">Find Me Online</h2>
      <ul className="list-unstyled fs-5 mt-3">
        <li className="mb-3">
          <FontAwesomeIcon icon="envelope" className="me-2 text-primary" />
          <strong>Email:</strong>{' '}
          <a href="mailto:suaybsimsek58@gmail.com" className="text-decoration-none">
            suaybsimsek58@gmail.com
          </a>
        </li>
        <li className="mb-3">
          <FontAwesomeIcon icon={['fab', 'linkedin']} className="me-2 text-info" />
          <strong>LinkedIn:</strong>{' '}
          <a
            href="https://linkedin.com/in/şuayb-şimşek-29b077178"
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none"
          >
            linkedin.com/in/şuayb-şimşek-29b077178
          </a>
        </li>
        <li className="mb-3">
          <FontAwesomeIcon icon={['fab', 'medium']} className="me-2 text-dark" />
          <strong>Medium:</strong>{' '}
          <a
            href="https://medium.com/@suaybsimsek58"
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none"
          >
            medium.com/@suaybsimsek58
          </a>
        </li>
        <li className="mb-3">
          <FontAwesomeIcon icon={['fab', 'github']} className="me-2 text-secondary" />
          <strong>GitHub:</strong>{' '}
          <a
            href="https://github.com/susimsek"
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none"
          >
            github.com/susimsek
          </a>
        </li>
      </ul>
    </Container>
  );
}
