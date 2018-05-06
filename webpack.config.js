const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const sourcePath = path.resolve(__dirname, 'src');
const buildPath = path.resolve(__dirname, 'build');

const commonConfig = {
  output: {
    path: buildPath,
    filename: '[name].js'
  },

  // This does completely different than what it looks like
  // 'false' disables mocking node globals
  node: false,

  devtool: 'sourcemap',
  mode: 'production'
};

module.exports = [
  {
    target: 'electron-main',
    entry: {
      'main/main': path.resolve(sourcePath, 'main/main')
    },
    ...commonConfig
  }, {
    target: 'electron-renderer',
    entry: {
      'renderer/renderer': path.resolve(sourcePath, 'renderer/renderer')
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
        },
        {
          test: /\.woff2/,
          use: [{
            loader: 'file-loader',
            options: {
              name: 'fonts/[name]-[hash].[ext]',
              outputPath: 'renderer'
            }
          }]
        }
      ]
    },

    plugins: [
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
