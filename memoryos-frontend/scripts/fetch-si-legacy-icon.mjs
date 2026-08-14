const slug = process.argv[2] || "MicrosoftSQLServer";
const url = `https://raw.githubusercontent.com/simple-icons/simple-icons/7.21.0/icons/${slug}.svg`;
const t = await fetch(url).then((r) => r.text());
console.log(t);
