// components/common/Footer.tsx
import Container from 'react-bootstrap/Container';
import { useTranslation } from 'react-i18next';
import { LAUNCH_YEAR } from '@/config/constants';

export default function Footer() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer py-3">
      <Container>
        <p className="text-center mb-0">{t('common.footer.text', { year: LAUNCH_YEAR, currentYear })}</p>
      </Container>
    </footer>
  );
}
