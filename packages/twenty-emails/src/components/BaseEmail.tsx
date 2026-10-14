import { type JSX } from 'react';
import { I18nProvider } from '@lingui/react';
import { Body, Container, Html, Section } from 'react-email';

import { BaseHead } from 'src/components/BaseHead';
import { Footer } from 'src/components/Footer';
import { Logo } from 'src/components/Logo';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type BaseEmailProps = {
  children: JSX.Element | JSX.Element[] | string;
  locale: keyof typeof APP_LOCALES;
};

const bodyStyle = {
  backgroundColor: '#eef1f6',
  fontFamily: "'Trebuchet MS', Verdana, sans-serif",
  margin: '0',
  padding: '24px 12px',
};

const wrapperStyle = {
  maxWidth: '600px',
  margin: '0 auto',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '32px 28px',
};

export const BaseEmail = ({ children, locale }: BaseEmailProps) => {
  const i18nInstance = createI18nInstance(locale);

  return (
    <I18nProvider i18n={i18nInstance}>
      <Html lang="es">
        <BaseHead />
        <Body style={bodyStyle}>
          <Container style={wrapperStyle}>
            <Section style={cardStyle} className="happy-card-inner">
              <Logo />
              {children}
              <Footer i18n={i18nInstance} />
            </Section>
          </Container>
        </Body>
      </Html>
    </I18nProvider>
  );
};
