const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');

// Get environment
const env = process.env.NODE_ENV || 'production';

// Common configuration
const commonConfig = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'HalosightEmbed',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this',
    },
    plugins: [
        new Dotenv({
            path: `./.env.${env}`, // Path to your .env file
            systemvars: true, // Load all system environment variables as well
        }),
    ],
};

// Production minified version
const minifiedConfig = {
    ...commonConfig,
    mode: env === 'development' ? 'development' : 'production',
    output: {
        ...commonConfig.output,
        filename: 'index.min.js',
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
};

// Production non-minified version
const nonMinifiedConfig = {
    ...commonConfig,
    mode: env === 'development' ? 'development' : 'production',
    output: {
        ...commonConfig.output,
        filename: 'index.js',
    },
    optimization: {
        minimize: false,
    },
};

module.exports = [minifiedConfig, nonMinifiedConfig];
