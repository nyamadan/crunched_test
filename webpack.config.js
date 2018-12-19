const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV || "development",
  devtool: process.env.NODE_ENV === "production" ? false : "inline-source-map",
  entry: {
    index: './src/index.tsx',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    splitChunks: {
      chunks: "all"
    }
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", "jsx", ".c", ".cpp"]
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.tsx?$/,
        use: [
          {
            loader: "tslint-loader",
            options: {
              typeCheck: true,
              fix: true,
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: "awesome-typescript-loader",
        exclude: /node_modules/
      },
      {
        test: /crunch_lib\.cpp$/,
        use: {
          loader: "cpp-wasm-loader",
          options: {
            /**
             * @param {ReadonlyArray<string>} existingFlags
             */
            emccFlags: (existingFlags) => {
              const flags = existingFlags.filter(x => !/^-O\d$/.test(x));

              Array.prototype.push.call(
                flags,
                "-I../inc",
                "-include", "stdint.h",
                "-s", "EXPORTED_FUNCTIONS=['_malloc', '_free', '_crn_get_width', '_crn_get_height', '_crn_get_levels', '_crn_get_dxt_format', '_crn_get_bytes_per_block', '_crn_get_uncompressed_size', '_crn_decompress']",
                "-s", "NO_EXIT_RUNTIME=1",
                "-s", "NO_FILESYSTEM=1",
                "-s", "ELIMINATE_DUPLICATE_FUNCTIONS=1",
                "-s", "ALLOW_MEMORY_GROWTH=1",
                "--memory-init-file", "0"
              );

              if (process.env.NODE_ENV === "production") {
                Array.prototype.push.call(
                  flags,
                  "-g0",
                  "-O2"
                );
              } else {
                Array.prototype.push.call(
                  flags,
                  "-g4",
                  "-O0"
                );
              }
              return flags;
            },
            fullEnv: true
          }
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: "./assets/**/*" }
    ]),
    new HtmlWebpackPlugin({
      title: "Crunched Texture Test"
    })
  ],
};