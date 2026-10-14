// Emails need an absolute logo URL. Served from the same server that
// renders them (it also serves the front build), via SERVER_URL.
const TWENTY_LOGO_FALLBACK_URL =
  'https://app.twenty.com/images/icons/windows11/Square150x150Logo.scale-100.png';

export const getHappyLogoUrl = () => {
  const serverUrl = process.env.SERVER_URL?.replace(/\/$/, '');

  return serverUrl
    ? `${serverUrl}/images/happy/logo.svg`
    : TWENTY_LOGO_FALLBACK_URL;
};
