import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = [
    ...nextVitals,
    ...nextTypescript,
    prettier,
    {
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            '@next/next/no-img-element': 'off',
        },
    },
    {
        // UI-template primitives predate the React Compiler rules; they're stable and covered by
        // their own behaviour, so these compiler-only checks are scoped off for them.
        files: ['src/components/ui/**'],
        rules: {
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
        },
    },
    { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'src/@types/supabase/database.types.ts'] },
]

export default eslintConfig
