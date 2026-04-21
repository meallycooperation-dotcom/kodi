const useAppStore = () => ({
  theme: 'light',
  setTheme: (value: 'light' | 'dark') => {
    void value;
  }
});

export default useAppStore;
