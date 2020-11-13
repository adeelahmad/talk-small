import { rollup } from 'rollup'
import path from 'path'
import { terser } from 'rollup-plugin-terser'
import svelte from 'rollup-plugin-svelte'
import html from '@rollup/plugin-html'
import fs from 'fs'
import { minify } from 'html-minifier-terser'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'

// custom module prefix and path to webviews
const PREFIX = 'webview:'
const WEBVIEWS_PATH = './src/webviews'

/**
 * Helper rollup plugin to support webview modules
 * @returns {import('rollup').Plugin}
 */
const webviewer = () => {
    // check production
    const isProduction = process.env.NODE_ENV === 'production'

    return {
        name: 'webviewer',

        // declare that this plugin supports webview:** type of modules
        resolveId(id) {
            if (id.startsWith(PREFIX)) return id
        },

        // implemets custom loader using a rollup instance for each webview
        async load(id) {
            if (id.startsWith(PREFIX)) {
                // resolve file paths from id
                const strippedId = id.slice(PREFIX.length)
                const mainJSPath = path.join(WEBVIEWS_PATH, strippedId, 'main.js')
                const templatePath = path.join(WEBVIEWS_PATH, strippedId, 'index.html')

                // create bundle for webview
                const bundle = await rollup({
                    input: mainJSPath,
                    plugins: [
                        replace({
                            'process.env.NODE_ENV': isProduction ? "'production'" : "'development'"
                        }),
                        resolve(),
                        commonjs(),
                        svelte({ css: css => css.write('main.css', false) }),
                        isProduction && terser(),
                        html({
                            template: ({ files: { js, css } }) => {
                                const script = js.find(file => file.fileName === 'main.js').code
                                const style = css && css.find(file => file.fileName === 'main.css').source || ''
                                const template = fs.readFileSync(templatePath, { encoding: 'utf8' })
                                // relpace /* $SCRIPT */ and /* $STYLE */ placeholders with actual code
                                return template.replace('/* $SCRIPT */', script).replace('/* $STYLE */', style)
                            }
                        })
                    ]
                })

                // tell rollup to watch template
                this.addWatchFile(templatePath)

                // tell rollup to watch dependencies of webview bundle as well
                bundle.watchFiles.forEach(watchFile => this.addWatchFile(watchFile))

                // generate webview bundle
                const result = await bundle.generate({})

                // get html page
                let source = result.output.find(chunkOrAsset => chunkOrAsset.fileName === 'index.html').source

                // minify it if in production
                if (isProduction) {
                    source = minify(source, {
                        collapseWhitespace: true,
                        minifyCSS: true
                    })
                }

                // return html page as default export (see rollup-plugin-string)
                return {
                    code: `export default ${JSON.stringify(source)};`,
                    map: { mappings: '' }
                }
            }
        }
    }
}

export default webviewer
