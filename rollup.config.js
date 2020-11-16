import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import builtins from 'builtin-modules'
import replace from '@rollup/plugin-replace'
import svelte from 'rollup-plugin-svelte'
import postcss from 'rollup-plugin-postcss'
import postcssUrl from 'postcss-url'
import postcssImport from 'postcss-import'
import copy from 'rollup-plugin-copy'
import { minify as htmlMinifier } from 'html-minifier-terser'
import autoPreprocess from 'svelte-preprocess'

const isProduction = process.env.NODE_ENV === 'production'

export default [
    {
        input: 'src/extension.js',
        output: {
            file: 'out/extension.js',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs(),
            isProduction && terser(),
            copy({
                targets: [{
                    src: 'node_modules/@fortawesome/fontawesome-free/svgs/solid/broadcast-tower.svg',
                    dest: 'out',
                    rename: 'icon.svg'
                }]
            })
        ],
        external: ['vscode', ...builtins]
    },
    {
        input: 'src/talk-small/main.js',
        output: {
            dir: 'out/public'
        },
        plugins: [
            resolve(),
            replace({
                values: {
                    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
                }
            }),
            svelte({
                emitCss: true,
                preprocess: autoPreprocess()
            }),
            postcss({
                extract: true,
                minimize: isProduction,
                sourceMap: false,
                plugins: [
                    postcssImport(),
                    postcssUrl({
                        url: 'inline',
                        ignoreFragmentWarning: true,
                        optimizeSvgEncode: true
                    })
                ]
            }),
            copy({
                targets: [{
                    src: 'src/talk-small/index.html',
                    dest: 'out/public',
                    transform(html) {
                        return isProduction ? htmlMinifier(
                            html.toString('utf8'),
                            { collapseWhitespace: true }
                        ) : html
                    }
                }]
            }),
            isProduction && terser()
        ]
    }
]
