import { type JSX } from 'react';
import { Heading } from 'react-email';

type TitleProps = {
  value: JSX.Element | JSX.Element[] | string;
};

const titleStyle = {
  fontFamily: "'Trebuchet MS', Verdana, sans-serif",
  fontSize: '22px',
  lineHeight: '28px',
  fontWeight: 700,
  color: '#101828',
  margin: '8px 0 12px 0',
};

export const Title = ({ value }: TitleProps) => {
  return (
    <Heading style={titleStyle} as="h1">
      {value}
    </Heading>
  );
};
