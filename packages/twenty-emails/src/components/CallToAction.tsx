import { type JSX } from 'react';
import { Button } from 'react-email';

const callToActionStyle = {
  display: 'inline-block',
  padding: '14px 36px',
  borderRadius: '999px',
  background: '#5271FF',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  marginTop: '8px',
};

type CallToActionProps = {
  href: string;
  value: JSX.Element | JSX.Element[] | string;
};

export const CallToAction = ({ value, href }: CallToActionProps) => {
  return (
    <span className="happy-cta">
      <Button href={href} style={callToActionStyle}>
        {value}
      </Button>
    </span>
  );
};
