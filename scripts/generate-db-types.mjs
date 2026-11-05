// Generates src/@types/supabase/database.types.ts from the SQL migrations — no Docker or Supabase CLI
// needed: the migrations run in PGlite (in-process Postgres) and the schema is introspected.
// Output follows the `supabase gen types typescript` format, so that command can replace this one later.
//
//   npm run db:types

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = join(root, 'supabase', 'migrations')
const outFile = join(root, 'src', '@types', 'supabase', 'database.types.ts')

const SHIM = `
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create schema storage;
    create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
`

const db = new PGlite()
await db.exec(SHIM)
for (const file of readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await db.exec(readFileSync(join(migrationsDir, file), 'utf8'))
}

const enums = (
    await db.query(`
        select t.typname as name, array_agg(e.enumlabel order by e.enumsortorder) as labels
        from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public' group by t.typname order by t.typname`)
).rows

const enumNames = new Set(enums.map((e) => e.name))

const columns = (
    await db.query(`
        select c.table_name, c.column_name, c.is_nullable = 'YES' as nullable, c.column_default is not null as has_default,
               c.is_identity = 'YES' as identity, c.udt_name, c.data_type
        from information_schema.columns c
        join information_schema.tables t on t.table_name = c.table_name and t.table_schema = c.table_schema
        where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
        order by c.table_name, c.ordinal_position`)
).rows

const fks = (
    await db.query(`
        select con.conname as name, src.relname as table_name,
               array(select a.attname from unnest(con.conkey) with ordinality k(n, i)
                     join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.n order by k.i) as columns,
               ref.relname as referenced_table,
               array(select a.attname from unnest(con.confkey) with ordinality k(n, i)
                     join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.n order by k.i) as referenced_columns,
               exists (select 1 from pg_constraint u where u.conrelid = con.conrelid and u.contype in ('p', 'u')
                       and u.conkey::int[] @> con.conkey::int[] and u.conkey::int[] <@ con.conkey::int[]) as one_to_one,
               refns.nspname as referenced_schema
        from pg_constraint con
        join pg_class src on src.oid = con.conrelid join pg_namespace ns on ns.oid = src.relnamespace
        join pg_class ref on ref.oid = con.confrelid join pg_namespace refns on refns.oid = ref.relnamespace
        where con.contype = 'f' and ns.nspname = 'public'
        order by src.relname, con.conname`)
).rows

const functions = (
    await db.query(`
        select p.proname as name, p.pronargs as nargs, p.pronargdefaults as ndefaults,
               coalesce(p.proargnames, '{}') as arg_names,
               array(select format_type(t, null) from unnest(p.proargtypes) t) as arg_types,
               format_type(p.prorettype, null) as return_type, p.proretset as returns_set,
               coalesce(p.proargmodes::text[], '{}') as arg_modes,
               array(select format_type(t, null) from unnest(coalesce(p.proallargtypes, p.proargtypes::oid[])) t) as all_arg_types
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prokind = 'f'
          and format_type(p.prorettype, null) <> 'trigger'
        order by p.proname`)
).rows

function tsType(udt, dataType) {
    const isArray = dataType === 'ARRAY' || udt.startsWith('_')
    const base = isArray ? udt.replace(/^_/, '') : udt
    let t
    if (enumNames.has(base)) t = `Database['public']['Enums']['${base}']`
    else if (
        [
            'uuid',
            'text',
            'varchar',
            'bpchar',
            'citext',
            'timestamptz',
            'timestamp',
            'date',
            'time',
            'interval',
        ].includes(base)
    )
        t = 'string'
    else if (['int2', 'int4', 'int8', 'numeric', 'float4', 'float8'].includes(base)) t = 'number'
    else if (base === 'bool') t = 'boolean'
    else if (base === 'json' || base === 'jsonb') t = 'Json'
    else t = 'unknown'
    return isArray ? `${t}[]` : t
}

// format_type() names → udt names
function formatTypeToUdt(name) {
    const isArray = name.endsWith('[]')
    const base = name.replace(/\[\]$/, '').replace(/^public\./, '')
    const map = {
        uuid: 'uuid',
        text: 'text',
        integer: 'int4',
        bigint: 'int8',
        smallint: 'int2',
        numeric: 'numeric',
        boolean: 'bool',
        jsonb: 'jsonb',
        json: 'json',
        'timestamp with time zone': 'timestamptz',
        'character varying': 'varchar',
        real: 'float4',
        'double precision': 'float8',
    }
    const udt = map[base] ?? base
    return { udt: isArray ? `_${udt}` : udt, dataType: isArray ? 'ARRAY' : 'USER' }
}

const tables = [...new Set(columns.map((c) => c.table_name))]
const q = (s) => `'${s}'`
const lines = []
lines.push('// Generated by scripts/generate-db-types.mjs from supabase/migrations — do not edit by hand.')
lines.push('// Regenerate with `npm run db:types` after changing a migration.')
lines.push('')
lines.push('export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]')
lines.push('')
lines.push('export type Database = {')
lines.push('    public: {')
lines.push('        Tables: {')
for (const table of tables) {
    const cols = columns.filter((c) => c.table_name === table)
    lines.push(`            ${table}: {`)
    lines.push('                Row: {')
    for (const c of cols)
        lines.push(
            `                    ${c.column_name}: ${tsType(c.udt_name, c.data_type)}${c.nullable ? ' | null' : ''}`,
        )
    lines.push('                }')
    for (const kind of ['Insert', 'Update']) {
        lines.push(`                ${kind}: {`)
        for (const c of cols) {
            const optional = kind === 'Update' || c.nullable || c.has_default || c.identity
            lines.push(
                `                    ${c.column_name}${optional ? '?' : ''}: ${tsType(c.udt_name, c.data_type)}${c.nullable ? ' | null' : ''}`,
            )
        }
        lines.push('                }')
    }
    const rels = fks.filter((f) => f.table_name === table && f.referenced_schema === 'public')
    if (rels.length === 0) {
        lines.push('                Relationships: []')
    } else {
        lines.push('                Relationships: [')
        for (const f of rels) {
            lines.push('                    {')
            lines.push(`                        foreignKeyName: ${q(f.name)}`)
            lines.push(`                        columns: [${f.columns.map(q).join(', ')}]`)
            lines.push(`                        isOneToOne: ${f.one_to_one}`)
            lines.push(`                        referencedRelation: ${q(f.referenced_table)}`)
            lines.push(`                        referencedColumns: [${f.referenced_columns.map(q).join(', ')}]`)
            lines.push('                    },')
        }
        lines.push('                ]')
    }
    lines.push('            }')
}
lines.push('        }')
lines.push('        Views: { [_ in never]: never }')
lines.push('        Functions: {')
for (const fn of functions) {
    const names = fn.arg_names.slice(0, fn.nargs)
    const firstDefault = fn.nargs - fn.ndefaults
    const args = fn.arg_types.map((type, i) => {
        const { udt, dataType } = formatTypeToUdt(type)
        return `${names[i] || `arg${i}`}${i >= firstDefault ? '?' : ''}: ${tsType(udt, dataType)}`
    })
    let returns
    // returns table (...): the output columns are the arguments with mode 't'
    const tableColumns = fn.arg_modes
        .map((mode, i) => (mode === 't' ? { name: fn.arg_names[i], type: fn.all_arg_types[i] } : null))
        .filter(Boolean)
    const retName = fn.return_type.replace(/^public\./, '')
    if (tableColumns.length) {
        const fields = tableColumns.map((c) => {
            const { udt, dataType } = formatTypeToUdt(c.type)
            return `${c.name}: ${tsType(udt, dataType)}`
        })
        returns = `{ ${fields.join('; ')} }`
    } else if (tables.includes(retName)) {
        const cols = columns.filter((c) => c.table_name === retName)
        returns = `{ ${cols.map((c) => `${c.column_name}: ${tsType(c.udt_name, c.data_type)}${c.nullable ? ' | null' : ''}`).join('; ')} }`
    } else {
        const { udt, dataType } = formatTypeToUdt(fn.return_type)
        returns = tsType(udt, dataType)
    }
    if (fn.returns_set) returns = `${returns}[]`
    lines.push(`            ${fn.name}: {`)
    lines.push(args.length ? `                Args: { ${args.join('; ')} }` : '                Args: never')
    lines.push(`                Returns: ${returns}`)
    lines.push('            }')
}
lines.push('        }')
lines.push('        Enums: {')
for (const e of enums) lines.push(`            ${e.name}: ${e.labels.map(q).join(' | ')}`)
lines.push('        }')
lines.push('        CompositeTypes: { [_ in never]: never }')
lines.push('    }')
lines.push('}')
lines.push('')
lines.push("type PublicSchema = Database['public']")
lines.push("export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']")
lines.push("export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']")
lines.push("export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']")
lines.push("export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]")
lines.push('')

writeFileSync(outFile, lines.join('\n'))
console.log(`Wrote ${outFile} (${tables.length} tables, ${functions.length} functions, ${enums.length} enums)`)
