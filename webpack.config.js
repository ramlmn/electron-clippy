const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const sourcePath = path.resolve(__dirname, 'src');
const buildPath = path.resolve(__dirname, 'build');

const IS_PROD = process.env.NODE_ENV === 'production';

const pathsToClean = [
  path.resolve(buildPath, 'main'),
  path.resolve(buildPath, 'renderer')
];

const commonConfig = {
  output: {
    path: buildPath,
    filename: '[name].js'
  },

  // This does completely different than what it looks like
  // 'false' disables mocking node globals
  node: false,

  devtool: IS_PROD ? false : 'source-map',
  mode: IS_PROD ? 'production' : 'development'
};

module.exports = [
  {
    target: 'electron-main',
    entry: {
      'main/main': path.resolve(sourcePath, 'main/main.js')
    },
    ...commonConfig
  }, {
    target: 'electron-renderer',
    entry: {
      'renderer/renderer': path.resolve(sourcePath, 'renderer/renderer.js')
    },

    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: !IS_PROD
              }
            }
          ]
        }
      ]
    },

    plugins: [
      new CleanWebpackPlugin(pathsToClean, {
        verbose: true
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css'
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(sourcePath, 'renderer/index.html'),
        filename: path.resolve(buildPath, 'renderer/index.html')
      }),
      new CopyWebpackPlugin([
        {
          from: path.resolve(sourcePath, 'renderer/img/*.png'),
          to: path.resolve(buildPath, 'renderer/img/'),
          flatten: true,
          transform(content) {
            // TODO: Maybe optimize images here
            return content;
          }
        }
      ])
    ],
    ...commonConfig
  }
];
