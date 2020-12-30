const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

let config = {
    entry: './app.js',
    output: {filename: 'app_dev_build.js'},
    target: 'node', // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
};
module.exports = config;


