const useAppStore = () => ({
  theme: 'light',
  setTheme: (value: 'light' | 'dark') => {
    console.log('setTheme called with', value);
  }
});

export default useAppStore;
