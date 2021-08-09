export const executeInSeries = <T>(
  providers: (() => Promise<T>)[]
): Promise<T[]> => {
  const ret: Promise<void> = Promise.resolve(undefined);
  const results: T[] = [];

  const reduced = providers.reduce((result, provider, index) => {
    const x = result.then(function () {
      return provider().then(function (val) {
        results[index] = val;
      });
    });
    return x;
  }, ret as Promise<void>);
  return reduced.then(() => results);
};
