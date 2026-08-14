/** One-off: extract Playwright logo paths from official repo SVG. */
const url =
  "https://raw.githubusercontent.com/microsoft/playwright/main/packages/recorder/public/playwright-logo.svg";
const svg = await fetch(url).then((r) => r.text());
const paths = [...svg.matchAll(/<path[^>]*\/>/g)].map((m) => m[0]);
const parsed = paths.map((tag) => {
  const d = tag.match(/d="([^"]+)"/)?.[1];
  const fill = tag.match(/fill="([^"]+)"/)?.[1];
  return { fill, d: d?.slice(0, 60) + "..." };
});
console.log(JSON.stringify(parsed, null, 2));
console.log("count", paths.length);
