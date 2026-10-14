import { type I18n } from '@lingui/core';
import { Text } from 'react-email';

type FooterProps = {
  i18n: I18n;
};

const footerStyle = {
  textAlign: 'center' as const,
  fontSize: '12px',
  lineHeight: '18px',
  color: '#667085',
  marginTop: '28px',
};

export const Footer = ({ i18n }: FooterProps) => {
  return <Text style={footerStyle}>{i18n._('Happy CRM · Colombia')}</Text>;
};
