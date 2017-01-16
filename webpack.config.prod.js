const path = require('path');
const webpack = require('webpack');

module.exports = {
    context: __dirname + '/library',
    devtool: 'source-map',
    resolve: {
        root: [path.resolve(__dirname, 'library'), path.resolve(__dirname, 'node_modules')],
        extensions: ['', '.js', '.json'],
        modulesDirectories: ['node_modules']
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle: false,
            sourceMap: true,
            compress: {
                unused: false,
                warnings: false
            }
        }),
        new webpack.optimize.AggressiveMergingPlugin()
    ],
    output: {
        path: __dirname + '/build',
        filename: '/skribble.js',
        publicPath: '/build/'
    },
    module: {
        preLoaders: [
            { test: /\.json$/, exclude: /node_modules/, loader: 'json' },
        ],
    },
    cache: false
};
