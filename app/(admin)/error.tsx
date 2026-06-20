'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-xl border border-red-200 shadow-md p-8 text-center">
        <div className="text-4xl mb-4">⚠</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-4">An error occurred in the admin dashboard.</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-left bg-red-50 border border-red-200 rounded p-4 mb-4 overflow-auto max-h-48 text-red-700">
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        )}
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#35291C] text-white text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
