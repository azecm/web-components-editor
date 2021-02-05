import typescript from 'rollup-plugin-typescript2';
import {extname,resolve} from 'path';
import {renderSync} from 'node-sass';
import {createFilter, dataToEsm} from '@rollup/pluginutils';
import alias from '@rollup/plugin-alias';
import csso from 'csso';


const isProduction = process.env.BUILD === 'production';

const outDir = isProduction ? '../../public/static' : '.';
const srcDir = './src';

const plugins = [
    alias({
        entries: [
            { find: 'icon', replacement:resolve(__dirname, 'src/icon') },
            { find: 'punycode', replacement:resolve(__dirname, 'node_modules/punycode/punycode.es6.js') }
        ]
    }),
    typescript({
        tsconfig: isProduction ? 'tsconfig.prod.json' : 'tsconfig.json',
    }),
    scss(),
    svg()
];

export default [
    {
        input: `${srcDir}/entry/admin.ts`,
        plugins,
        output: {
            file: `${outDir}/admin/admin.js`,
            format: 'iife',
        }
    },
    {
        input: `${srcDir}/entry/control.ts`,
        plugins,
        output: {
            file: `${outDir}/control/control.js`,
            format: 'iife',
        }
    }
];

function scss(options = {}) {
    const filter = createFilter(options.include, options.exclude);
    const extracted = new Map();
    return {
        name: 'scss',
        transform(code, id) {

            if (extname(id) !== '.scss' || !filter(id)) return null;

            let encoded = '';

            try {
                if (code && code.trim()) {
                    encoded = csso.minify(renderSync({data: code}).css.toString()).css;
                }
            } catch (e) {
                console.error(id);
                console.error(e.formatted);
            }


            if (id.endsWith('.glob.scss')) {
                if (encoded.length) {
                    extracted.set(id, encoded);
                }
                return {code: '', map: {mappings: ''}};
            }

            return {code: dataToEsm(encoded, {compact: true}), map: {mappings: ''}};
        },
    }
}


function svg() {
    return {
        name: 'svg',
        transform(code, id) {
            if (extname(id) !== '.svg') {
                return null;
            }

            const encoded = code.trim().replace(/\s*\n\s*/g, ' ').replace(/\r/g, '');
            return {code: dataToEsm(encoded, {compact: true}), map: {mappings: ''}}
        }
    }
}
