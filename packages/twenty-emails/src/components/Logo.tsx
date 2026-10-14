import { Img } from 'react-email';

import { getHappyLogoUrl } from 'src/utils/logo.utils';

const logoStyle = {
  marginBottom: '24px',
};

export const Logo = () => {
  return (
    <Img
      src={getHappyLogoUrl()}
      alt="Happy CRM"
      width="48"
      height="48"
      style={logoStyle}
    />
  );
};
