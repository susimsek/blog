// components/common/Footer.tsx
import { Container } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';
import { LAUNCH_YEAR } from '@/config/constants';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="footer py-3">
      <Container>
        <p className="text-center mb-0">{t('common.footer.text', { year: LAUNCH_YEAR })}</p>
      </Container>
    </footer>
  );
}
