import { type JSX } from 'react';
import { Text } from 'react-email';

type MainTextProps = {
  children: JSX.Element | JSX.Element[] | string;
};

const mainTextStyle = {
  fontFamily: "'Trebuchet MS', Verdana, sans-serif",
  fontSize: '14px',
  fontWeight: 400,
  color: '#344054',
  lineHeight: '24px',
  margin: '0 0 12px 0',
};

export const MainText = ({ children }: MainTextProps) => {
  return <Text style={mainTextStyle}>{children}</Text>;
};
