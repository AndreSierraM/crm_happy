import { Font, Head } from 'react-email';

import { canvasTheme } from 'src/common-style';

export const BaseHead = () => {
  return (
    <Head>
      <title>Happy CRM email</title>
      <Font
        fontFamily={canvasTheme.font.family}
        fallbackFontFamily="sans-serif"
        fontStyle="normal"
        fontWeight={canvasTheme.font.weight.regular}
      />
      <style>{`.happy-card-inner { width: 100% !important; }
@media only screen and (max-width: 480px) {
  .happy-card-inner { padding-left: 20px !important; padding-right: 20px !important; }
  .happy-cta a { display: block !important; text-align: center !important; }
}`}</style>
    </Head>
  );
};
