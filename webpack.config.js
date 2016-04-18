const path = require('path');
module.exports = {
    entry: './src/index.js',
    output: {
        libraryTarget: "umd",
        path: path.join(__dirname, 'dist'),
        filename: 'streams.js'
    },
    module: {
        loaders: [
            {
                test: path.join(__dirname, 'src'),
                loader: 'babel-loader'
            }
        ]
    }
};