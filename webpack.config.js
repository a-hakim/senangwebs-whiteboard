const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const packageJson = require('./package.json');

class RemoveStyleScriptPlugin {
  apply(compiler) {
    const removeStaleStyleScripts = () => {
      for (const assetName of ['styles.js', 'styles.min.js']) {
        fs.rmSync(path.join(compiler.options.output.path, assetName), {
          force: true
        });
      }
    };

    compiler.hooks.beforeRun.tap('RemoveStyleScriptPlugin', removeStaleStyleScripts);
    compiler.hooks.watchRun.tap('RemoveStyleScriptPlugin', removeStaleStyleScripts);

    compiler.hooks.thisCompilation.tap('RemoveStyleScriptPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'RemoveStyleScriptPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
        },
        () => {
          for (const assetName of Object.keys(compilation.assets)) {
            if (/^styles(?:\.min)?\.js$/.test(assetName)) {
              compilation.deleteAsset(assetName);
            }
          }
        }
      );
    });
  }
}

function createConfig({ minified = false, mode = 'production' } = {}) {
  const suffix = minified ? '.min' : '';

  return {
    name: minified ? 'minified' : 'unminified',
    mode,
    entry: {
      sww: './src/js/sww.js',
      styles: './src/css/sww.css'
    },
    output: {
      filename: `[name]${suffix}.js`,
      path: path.resolve(__dirname, 'dist'),
      library: {
        name: 'SWW',
        type: 'umd',
        export: 'default'
      },
      globalObject: 'this',
      assetModuleFilename: 'assets/[name][ext]'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader']
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]'
          }
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name][ext]'
          }
        }
      ]
    },
    optimization: {
      minimize: minified,
      minimizer: [
        new TerserPlugin(),
        new CssMinimizerPlugin()
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        __SWW_VERSION__: JSON.stringify(packageJson.version)
      }),
      new MiniCssExtractPlugin({
        filename: `sww${suffix}.css`
      }),
      new RemoveStyleScriptPlugin()
    ],
    performance: {
      hints: false
    }
  };
}

module.exports = (_env, argv) => {
  if (argv.mode === 'development') {
    return createConfig({ mode: 'development' });
  }

  return [
    createConfig(),
    createConfig({ minified: true })
  ];
};
