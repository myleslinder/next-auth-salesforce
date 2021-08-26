const fetcher =
  typeof global.fetch !== undefined
    ? fetch
    : (await import("node-fetch")).default;
