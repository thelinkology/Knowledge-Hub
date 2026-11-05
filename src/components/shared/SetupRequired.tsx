import { LogoMark } from '@/components/template/Logo'
import { portalName } from '@/configs/app.config'

/** Shown instead of the app until the Supabase environment variables are set (local setup / new deployments). */
export default function SetupRequired() {
    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
                <LogoMark size={44} />
                <h1 className="mt-4 text-2xl">{portalName} needs its database</h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    The Supabase connection isn’t configured on this server yet. Add these environment variables
                    (locally in <code>.env.local</code>, or in your Vercel project settings) and restart:
                </p>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-100 p-4 text-sm dark:bg-gray-900">
                    {`SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable or anon key>
SUPABASE_SECRET_KEY=<secret or service_role key>`}
                </pre>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Then apply the migrations in <code>supabase/migrations</code> to the project. The README has
                    step-by-step setup.
                </p>
            </div>
        </main>
    )
}
