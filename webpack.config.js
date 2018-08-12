const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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

  devtool: 'sourcemap',
  mode: IS_PROD ? 'production' : 'development'
};

if (!IS_PROD) {
  commonConfig.devtool = 'sourcemap';
}

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
                minimize: true,
                sourcemap: true
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
      })
    ],
    ...commonConfig
  }
];
