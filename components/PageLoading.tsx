import Logo from '@/components/Logo';

interface PageLoadingProps {
    label?: string;
}

export default function PageLoading({ label = 'Opening page...' }: PageLoadingProps) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="p-4 sm:p-6">
                <Logo size={40} className="sm:hidden" />
                <Logo size={48} className="hidden sm:flex" />
            </header>
            <main className="flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-lg">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    <p className="text-sm font-bold text-slate-700">{label}</p>
                </div>
            </main>
        </div>
    );
}
