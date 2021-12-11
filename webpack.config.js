const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: '/site/src/main.js',
	plugins: [
		new HtmlWebpackPlugin({
			template: 'site/src/site.html',
		}),
	],
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'site')
	},
	module: {
		rules: [
			{
				test: /\.html$/,
				loader: 'html-loader'
			},

			{
				test: /\.m?js$/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env"], // ensure compatibility with older browsers
						plugins: ["@babel/plugin-transform-object-assign"], // ensure compatibility with IE 11
					},
				},
			},
			{
				test: /\.js$/,
				loader: "webpack-remove-debug", // remove "debug" package
			}
		],
	},
};