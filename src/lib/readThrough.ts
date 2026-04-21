type ReadThroughOptions<T> = {
  loadCached: () => Promise<T>;
  loadFresh: () => Promise<T>;
  onCached: (value: T) => void;
  onFresh: (value: T) => void;
  onError?: (error: unknown) => void;
  onFinally?: () => void;
  isActive: () => boolean;
};

export const loadReadThrough = async <T>({
  loadCached,
  loadFresh,
  onCached,
  onFresh,
  onError,
  onFinally,
  isActive
}: ReadThroughOptions<T>) => {
  try {
    const cached = await loadCached();
    if (isActive()) {
      onCached(cached);
    }
  } catch (error) {
    onError?.(error);
  }

  try {
    const fresh = await loadFresh();
    if (isActive()) {
      onFresh(fresh);
    }
  } catch (error) {
    onError?.(error);
  } finally {
    onFinally?.();
  }
};
