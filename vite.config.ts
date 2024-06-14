/** @type {import('vite').UserConfig} */

import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {

    // rely on the .env, .env.development, .env.production files for our configs

    const env = loadEnv(mode, process.cwd(), '')
    const baseurl_path = env.VITE_BASEURL_PATH;

    // The vite config, just the stuff vite needs to serve/build
    // The base ends up statically replaced and available as import.meta.env.BASE_URL
    // It it was empty it will be set as '/'
    const vitconfig = {
        base: baseurl_path
    };

    console.log(JSON.stringify(vitconfig));

    return vitconfig;
});