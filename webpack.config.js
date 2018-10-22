/* global process, __dirname */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const env = process.env.NODE_ENV;

const PATHS = {
    static: path.resolve(__dirname, 'src/encoded/static'),
    build: path.resolve(__dirname, 'src/encoded/static/build'),
    serverbuild: path.resolve(__dirname, 'src/encoded/static/build-server'),
    fonts: path.resolve(__dirname, 'src/encoded/static/font'),
    images: path.resolve(__dirname, 'src/encoded/static/img'),
};

const plugins = [];
// don't include momentjs locales (large)
plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/));

// To get auth0 v11 to build correctly:
// https://github.com/felixge/node-formidable/issues/337#issuecomment-183388869
plugins.push(new webpack.DefinePlugin({ 'global.GENTLY': false }));

let chunkFilename = '[name].js';
let styleFilename = './css/[name].css';
let minimizer = {};

if (env === 'production') {
    // Set production version of React
    // https://stackoverflow.com/questions/37311972/react-doesnt-switch-to-production-mode#answer-37311994
    plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(env),
            },
        })
    );

    // add chunkhash to chunk names for production only (it's slower)
    chunkFilename = '[name].[chunkhash].js';
    styleFilename = './css/[name].[chunkhash].css';

    minimizer = [new UglifyJsPlugin()];
}

const rules = [
    {
        test: /\.js$/,
        include: [
            PATHS.static,
            path.resolve(__dirname, 'node_modules/dagre-d3'),
            path.resolve(__dirname, 'node_modules/dalliance'),
            path.resolve(__dirname, 'node_modules/superagent'),
        ],
        use: 'babel-loader',
    },
    {
        test: /\.json$/,
        use: 'json-loader',
    },
    {
        test: /\.(jpg|png|gif)$/,
        loader: 'url?limit=25000',
        include: PATHS.images,
    },
    {
        test: /\.scss$/,
        use: [
            {
                loader: MiniCssExtractPlugin.loader,
                options: {
                    // you can specify a publicPath here
                    // by default it use publicPath in webpackOptions.output
                    publicPath: '../',
                },
            },
            'css-loader',
            'sass-loader',
        ],
    },
];

module.exports = [
    // for browser
    {
        context: PATHS.static,
        optimization: {
            splitChunks: {
                cacheGroups: {
                    styles: {
                        name: 'styles',
                        test: /\.css$/,
                        chunks: 'all',
                        enforce: true,
                    },
                },
            },
            minimizer,
        },
        entry: {
            inline: './inline.js',
            style: './scss/style.scss',
        },
        output: {
            path: PATHS.build,
            publicPath: '/static/build/',
            filename: '[name].js',
            chunkFilename,
        },
        module: {
            rules,
        },
        devtool: 'source-map',
        plugins: plugins.concat(
            // Add a browser-only plugin to extract Sass-compiled styles and place them into an
            // external CSS file
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: env === 'production' ? '[name].[hash].css' : '[name].css',
                chunkFilename: env === 'production' ? '[id].[hash].css' : '[id].css',
            }),

            // Add a browser-only plugin executed when webpack is done with all transforms. it
            // writes minimal build statistics to the "build" directory that contains the hashed
            // CSS file names that the server can render into the <link rel="stylesheet"> tag.
            function writeWPStats() {
                this.plugin('done', (stats) => {
                    // Write hash stats to stats.json so we can extract the CSS hashed file name.
                    require('fs').writeFileSync(
                        path.join(PATHS.build, 'stats.json'),
                        JSON.stringify(stats.toJson({ hash: true }, 'none')));
                });
            }
        ),
    },
    // for server-side rendering
    {
        entry: {
            renderer: './server.js',
        },
        target: 'node',
        // make sure compiled modules can use original __dirname
        node: {
            __dirname: true,
        },
        externals: [
            'brace',
            'brace/mode/json',
            'brace/theme/solarized_light',
            'd3',
            'dagre-d3',
            'chart.js',
            'dalliance',
            // avoid bundling babel transpiler, which is not used at runtime
            'babel-core/register',
        ],
        output: {
            path: PATHS.serverbuild,
            publicPath: '/static/build-server',
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            chunkFilename,
        },
        module: {
            rules,
        },
        devtool: 'source-map',
        plugins,
    },
];
