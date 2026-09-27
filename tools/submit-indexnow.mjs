const host = "khonenama.ir";
const key = "7f4b2a9d8c1e3f6075ab4d9e2c6f81a3";
const keyLocation = `https://${host}/${key}.txt`;
const sitemapUrl = `https://${host}/sitemap.xml`;

const sitemapResponse = await fetch(sitemapUrl, {
  headers: { "user-agent": "Khonenama-IndexNow/1.0" },
});

if (!sitemapResponse.ok) {
  throw new Error(`Could not fetch sitemap: ${sitemapResponse.status}`);
}

const xml = await sitemapResponse.text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());

if (!urlList.length) {
  throw new Error("No URLs found in sitemap");
}

const submitResponse = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});

if (![200, 202].includes(submitResponse.status)) {
  const body = await submitResponse.text();
  throw new Error(`IndexNow failed: ${submitResponse.status} ${body.slice(0, 300)}`);
}

console.log(`IndexNow accepted ${urlList.length} Khonenama URLs with status ${submitResponse.status}.`);
