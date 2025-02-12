// components/common/Footer.tsx
import { Container } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';

export default function Footer() {
  const { t } = useTranslation('common');
  const currentYear = 2024;

  return (
    <footer className="footer py-3">
      <Container>
        <p className="text-center mb-0">{t('common.footer.text', { year: currentYear })}</p>
      </Container>
    </footer>
  );
}
