const useAppStore = () => ({
    theme: 'light',
    setTheme: (value) => {
        console.log('setTheme called with', value);
    }
});
export default useAppStore;
