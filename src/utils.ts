export const wait = (fn: () => void, timeout = 5000) => setTimeout(fn, timeout);
