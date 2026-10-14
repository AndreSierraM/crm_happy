import { Img } from 'react-email';

import { getHappyLogoUrl } from 'src/utils/logo.utils';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  return (
    <Img
      src={getHappyLogoUrl()}
      alt="Happy CRM logo"
      width="40"
      height="40"
      style={logoStyle}
    />
  );
};
