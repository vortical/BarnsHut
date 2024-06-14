const config = {
    baseUrl: import.meta.env.BASE_URL,
    baseUrlPath: import.meta.env.VITE_BASEURL_PATH,
    isMobile: (/Mobi|Android|iPhone/i.test(navigator.userAgent))
};

export default config;
