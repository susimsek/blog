import { Container, Navbar, Nav } from 'react-bootstrap';
import Image from 'next/image';
import { assetPrefix } from '@/config/constants';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '@/reducers/theme';
import { RootState } from '@/config/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from '../components/Link';
import { useTranslation } from 'next-i18next';

export default function Header() {
  const { t } = useTranslation('common');
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);

  return (
    <Navbar expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} href="/" className="d-flex align-items-center link">
          <Image
            src={`${assetPrefix}/images/logo.png`}
            alt={t('common.header.logoAlt')}
            width={40}
            height={40}
            priority
            className="rounded-circle"
          />
          <span className={`ms-2 fw-bold `} style={{ fontSize: '1.25rem' }}>
            {t('common.header.title')}
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav">
          <FontAwesomeIcon icon="bars" className="navbar-toggler-icon" />
        </Navbar.Toggle>
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto d-flex gap-3 align-items-center">
            <Nav.Link as={Link} href="/">
              {t('common.header.menu.home')}
            </Nav.Link>
            <Nav.Link as={Link} href="/about">
              {t('common.header.menu.about')}
            </Nav.Link>
            <Nav.Link as={Link} href="/contact">
              {t('common.header.menu.contact')}
            </Nav.Link>
            <button
              className={`btn theme-toggle-btn d-flex align-items-center gap-2 ${theme}`}
              onClick={() => dispatch(toggleTheme())}
              aria-label={t('common.header.themeToggle')}
            >
              <FontAwesomeIcon icon={theme === 'light' ? 'moon' : 'sun'} />
              <span>{t(`common.header.theme.${theme}`)}</span>
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}