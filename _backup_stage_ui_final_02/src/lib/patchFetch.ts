// Ensures window.fetch has both getter and setter in iframe and sandbox environments
// preventing "Cannot set property fetch of #<Window> which has only a getter"
if (typeof window !== 'undefined') {
  try {
    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    let currentFetch = nativeFetch;

    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get() {
        return currentFetch;
      },
      set(val) {
        currentFetch = val;
      },
    });

    if (typeof Window !== 'undefined' && Window.prototype) {
      try {
        Object.defineProperty(Window.prototype, 'fetch', {
          configurable: true,
          enumerable: true,
          get() {
            return currentFetch;
          },
          set(val) {
            currentFetch = val;
          },
        });
      } catch {
        // ignore if prototype is sealed
      }
    }
  } catch {
    // ignore
  }
}

export {};
