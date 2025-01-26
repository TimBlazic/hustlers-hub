export function AuthContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-[400px] space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Hustlers Hub
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Platforma za ambiciozne podjetnike
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
