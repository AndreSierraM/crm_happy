import { Column, Container, Row } from 'react-email';
import React, { type JSX } from 'react';

type HighlightedContainerProps = {
  children: JSX.Element | JSX.Element[] | string;
};

const highlightedContainerStyle = {
  background: '#eef3ff',
  border: '1px solid #d7e2ff',
  borderRadius: '16px',
  padding: '24px 20px',
} as React.CSSProperties;

export const HighlightedContainer = ({
  children,
}: HighlightedContainerProps) => {
  return (
    <Container style={highlightedContainerStyle}>
      {React.Children.map(children, (child) => (
        <Row>
          <Column align="center">{child}</Column>
        </Row>
      ))}
    </Container>
  );
};
