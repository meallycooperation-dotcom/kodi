type PageLoaderProps = {
  message?: string;
};

const PageLoader = ({ message = 'Loading page content...' }: PageLoaderProps) => (
  <section className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="flex flex-col items-center gap-4 text-center">
      <span
        className="h-20 w-20 rounded-full border-8 border-gray-200 border-t-blue-500 animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  </section>
);

export default PageLoader;
