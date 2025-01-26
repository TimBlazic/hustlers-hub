interface AlertProps {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  const styles = {
    success:
      "bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    error: "bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    info: "bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  };

  return (
    <div className={`rounded-lg p-4 ${styles[type]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
