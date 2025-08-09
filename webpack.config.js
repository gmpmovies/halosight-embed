const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

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
};

// Production minified version
const minifiedConfig = {
    ...commonConfig,
    mode: 'production',
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
    mode: 'production',
    output: {
        ...commonConfig.output,
        filename: 'index.js',
    },
    optimization: {
        minimize: false,
    },
};

module.exports = [minifiedConfig, nonMinifiedConfig];
