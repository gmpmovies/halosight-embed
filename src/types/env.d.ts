declare namespace NodeJS {
    interface ProcessEnv {
        HALOSIGHT_EMBED_URL?: string;
        NODE_ENV: 'development' | 'production';
    }
}
