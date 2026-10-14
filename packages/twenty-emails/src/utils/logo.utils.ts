// Emails need an absolute logo URL. Served from the same server that
// renders them (it also serves the front build), via SERVER_URL.
export const getHappyLogoUrl = () => {
  const serverUrl = process.env.SERVER_URL?.replace(/\/$/, '');

  return serverUrl
    ? `${serverUrl}/images/happy/logo.png`
    : '/images/happy/logo.png';
};
