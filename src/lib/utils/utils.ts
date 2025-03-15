export const debounce = (function() {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function<T extends (...args: any[]) => any>(
    this: any,
    func: T, 
    timeout: number, 
    context?: any,
    ...args: Parameters<T>
  ): ReturnType<typeof setTimeout> {
    context = context || this;
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, timeout);

    return timeoutId;
  };
})();
