import webviewer from './rollup-plugin-webviewer'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import builtins from 'builtin-modules'

const isProduction = process.env.NODE_ENV === 'production'

export default {
    input: 'src/extension.js',
    output: {
        file: 'out/extension.js',
        format: 'cjs'
    },
    plugins: [
        webviewer(),
        resolve(),
        commonjs(),
        isProduction && terser()
    ],
    external: ['vscode', ...builtins]
}
