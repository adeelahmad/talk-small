import { createFilter } from '@rollup/pluginutils'
import { parse as parseHtml } from 'node-html-parser'
import { rollup } from 'rollup'
import { URL } from 'url'
import path from 'path'
import { terser } from 'rollup-plugin-terser'
import { minify as minifyHtml } from 'html-minifier-terser'

/**
 * Checks whether the given url is absolute or not (relative)
 * @param {string} url 
 * @returns {boolean}
 */
const isAbsoluteUrl = (url) => {
    try {
        return !!new URL(url)
    } catch (e) {
        return false
    }
}

/**
 * Helper rollup plugin to inline html and all of its dependencies
 * @returns {import('rollup').Plugin}
 */
const webviewer = () => {
    // check production
    const isProduction = process.env.NODE_ENV === 'production'

    // filters webview file
    const htmlFilter = createFilter('**/webview/index.html')
    return {
        name: 'webviewer',
        async transform(code, id) {
            if (htmlFilter(id)) {
                // parse html code
                const html = parseHtml(code)

                // extract scripts with relative urls
                const scripts = html.querySelectorAll('script')
                    .filter(script => !isAbsoluteUrl(script.getAttribute('src')))

                // generate output of each script
                const outputs = await Promise.all(scripts.map(async script => {
                    const src = script.getAttribute('src')
                    const bundle = await rollup({
                        input: path.join(id, '..', src),
                        plugins: [isProduction && terser()]
                    })
                    const result = await bundle.generate({})
                    return result.output[0].code
                }))

                // change given scripts from relative-src to inline ones
                scripts.forEach((script, i) => {
                    script.removeAttribute('src')
                    script.set_content(outputs[i])
                })

                // generate minified html if in production
                const outputHtml = !isProduction ? html.outerHTML : minifyHtml(html.outerHTML, {
                    collapseWhitespace: true,
                    minifyCSS: true
                })

                // return stringified html code (see rollup-plugin-string)
                return {
                    code: `export default ${JSON.stringify(outputHtml)}`,
                    map: { mappings: '' }
                }
            }
        }
    }
}

export default webviewer
