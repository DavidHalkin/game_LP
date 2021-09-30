const TerserPlugin = require('terser-webpack-plugin');

module.exports = async function() {

    return {
        mode: 'production',
        entry: __dirname + '/js/main.js',
        output: {
            path: __dirname + '/js',
            filename: 'main.min.js'
        },
        optimization: {
            usedExports: true,
            minimizer: [
                new TerserPlugin({
                    extractComments: false,
                    terserOptions: {
                        // ecma: undefined,
                        // warnings: false,
                        // parse: {},
                        // compress: {},
                        // mangle: true, // Note `mangle.properties` is `false` by default.
                        // module: false,
                        output: {
                            comments: false
                        },
                        // toplevel: false,
                        // nameCache: null,
                        // ie8: false,
                        // keep_classnames: undefined,
                        // keep_fnames: false,
                        // safari10: true
                    },
                })
            ]
        }
    }

};
