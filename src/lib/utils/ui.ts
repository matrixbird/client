export function isInViewport(element: Element): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          resolve(true);
        } else {
          resolve(false);
        }
        observer.disconnect();
      });
    });

    observer.observe(element);
  });
}

