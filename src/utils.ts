export const fetcher = <T>(url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((data: T) => data);
