export interface Env {
  BTC_CACHE: KVNamespace;
  COINGECKO_API_KEY: string;
}

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
    last_updated_at: number;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/favicon.ico") {
      
      const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100">
        <text y="0.9em" font-size="90">🌊</text>
      </svg>`;

      return new Response(FAVICON_SVG, {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=86400"
        }
      });
    }

    switch (url.pathname) {
      case "/btc-usd.json":
        return btcUsdFeed(request, env);
      case "/aemet/mapa-isobaras.json":
        return aemetIsobarsFeed(request, env);
      default:
        return new Response(
          JSON.stringify({
            endpoints: [
              "/btc-usd.json",
              "/aemet/mapa-isobaras.json"
            ]
          }, null, 2),
          { headers: { "content-type": "application/json; charset=utf-8" } }
        );
    }
  },
};

// Move your existing feed logic here
async function btcUsdFeed(request: Request, env: Env): Promise<Response> {
      const cacheKey = "btc_feed";
    const CACHE_TTL_MS = 60 * 1000; // 1 minute

    // 1️⃣ Check KV cache
    const cachedData = await env.BTC_CACHE.get(cacheKey, { type: "json" });
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cachedData.feed, null, 2), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // 2️⃣ Fetch from CoinGecko API
    const apiUrl = "https://api.coingecko.com/api/v3/coins/bitcoin";
    const response = await fetch(apiUrl, {
      headers: {
        "accept": "application/json",
        "x-cg-demo-api-key": env.COINGECKO_API_KEY, // required for authenticated plan
      },
    });

    if (!response.ok) {
      if (cachedData) {
        // fallback to last cached feed
        return new Response(JSON.stringify(cachedData.feed, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to fetch Bitcoin price" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const data: CoinGeckoResponse = await response.json();
    const price = data.market_data.current_price.usd;
    const time = new Date().toISOString();

    // 3️⃣ Build JSON Feed
    const feed = {
      version: "https://jsonfeed.org/version/1",
      title: "Bitcoin USD Price Feed",
      home_page_url: "https://laro.dev",
      feed_url: request.url,
      description: `Current Bitcoin price in USD updated every minute. Price provided by CoinGecko. Feed created by laro.dev.`,
      items: [
        {
          id: time,
          title: `BTC/USD: $${price.toFixed(2)}`,
          content_html: `<p>Current Bitcoin price: <b>$${price.toFixed(2)}</b> USD. Price provided by CoinGecko. Feed created by laro.dev.</p>`,
          content_text: `Current Bitcoin price: $${price.toFixed(2)} USD. Price provided by CoinGecko. Feed created by <a href="https://laro.dev" target="_blank" rel="noreferrer" title="laro.dev" aria-label="laro.dev">laro.dev</a>.`,
		  summary: `Current Bitcoin price: $${price.toFixed(2)} USD. Price provided by CoinGecko. Feed created by laro.dev.`,
          date_published: time,
		  author: "laro.dev",
          url: "https://www.coingecko.com/en/coins/bitcoin",
		  external_url: "https://laro.dev"
        },
      ],
    };

    // 4️⃣ Save to KV
    await env.BTC_CACHE.put(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), feed }),
      { expirationTtl: 120 } // keep it in KV for 2 minutes
    );

    // 5️⃣ Return response
    return new Response(JSON.stringify(feed, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    });
}

async function aemetIsobarsFeed(request: Request, env: Env): Promise<Response> {
  const cacheKey = "aemet_isobars_feed";
  const NOW = new Date();
  const madridTZ = "Europe/Madrid";

  // Helper to get parts in Europe/Madrid
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: madridTZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false
  });
  const parts = Object.fromEntries(dtf.formatToParts(NOW).map(p => [p.type, p.value]));
  const hourCEST = parseInt(parts.hour, 10);

  // Spanish month names
  const spanishMonths = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  // Determine map reference (previous day 12h if before 12, else today 00h)
  let mapDate = new Date(NOW);
  let mapHour: string;
  if (hourCEST < 12) {
    mapDate = new Date(mapDate.getTime() - 24 * 60 * 60 * 1000);
    mapHour = "12";
  } else {
    mapHour = "00";
  }

  const mapParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: madridTZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(mapDate).map(p => [p.type, p.value])
  );

  const mapYear = mapParts.year;
  const mapMonthNum = mapParts.month;
  const mapDay = mapParts.day;
  const mapMonthEs = spanishMonths[parseInt(mapMonthNum, 10) - 1];

  // Madrid timestamp (published)
  const madridPublished = new Intl.DateTimeFormat("sv-SE", {
    timeZone: madridTZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(NOW).replace(" ", "T") + "Z";

  // Cache strategy: update every 6h (maps appear twice daily)
  const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3h grace
  const cached = await env.BTC_CACHE.get(cacheKey, { type: "json" }) as any;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return new Response(JSON.stringify(cached.feed, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=1800"
      }
    });
  }

  // Fetch AEMET API (first level)
  const apiUrl = "https://opendata.aemet.es/opendata/api/mapasygraficos/analisis";
  let imageDataBase64: string | null = null;
  let imageContentType = "image/gif";
  let imageUrl: string | null = null;

  try {
    const metaResp = await fetch(apiUrl, {
      headers: {
        "accept": "application/json",
        "api_key": env.AEMET_API_KEY
      }
    });

    if (metaResp.ok) {
      const metaJson = await metaResp.json();
      imageUrl = metaJson.datos || null;
      if (imageUrl) {
        const imgResp = await fetch(imageUrl);
        if (imgResp.ok) {
          imageContentType = imgResp.headers.get("content-type") || imageContentType;
          const buf = await imgResp.arrayBuffer();
          imageDataBase64 = toBase64(new Uint8Array(buf));
        }
      }
    }
  } catch (e) {
    // silent; will fallback
  }

  if (!imageDataBase64) {
    // Fallback transparent 1x1 GIF
    const fallback = Uint8Array.from([
      71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,255,255,255,33,249,4,1,0,0,1,0,44,
      0,0,0,0,1,0,1,0,0,2,2,68,1,0,59
    ]);
    imageDataBase64 = toBase64(fallback);
    imageContentType = "image/gif";
    imageUrl = null;
  }
  // Determine dimensions (GIF parsing)
  let w: number | null = null;
  let h: number | null = null;
  if (imageBytes && imageBytes.length >= 10) {
    const header = String.fromCharCode(...imageBytes.slice(0, 6));
    if (header === "GIF87a" || header === "GIF89a") {
      w = imageBytes[6] + (imageBytes[7] << 8);
      h = imageBytes[8] + (imageBytes[9] << 8);
    }
  }
  // Build rotated content_html (90 deg clockwise)
  let contentHtml: string;
  if (w !== null && h !== null) {
    // viewBox width = height (after rotation), height = width
    // Clockwise rotation: rotate(-90) then translate(0, width)
    contentHtml =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${h}" height="${w}" viewBox="0 0 ${h} ${w}" role="img" aria-label="${title}">` +
      `<title>${title}</title>` +
      `<image href="data:${imageContentType};base64,${imageDataBase64}" width="${w}" height="${h}" transform="rotate(-90) translate(0 ${w})" />` +
      `</svg>`;
  } else {
    // Fallback CSS rotation if dimensions unknown
    contentHtml =
      `<div style="display:inline-block; transform:rotate(90deg); transform-origin:top left;">` +
      `<img alt="${title}" src="data:${imageContentType};base64,${imageDataBase64}" style="max-width:100%;height:auto;" />` +
      `</div>`;
  }

  const title = `Mapa isobaras, a ${parseInt(mapDay,10)} de ${mapMonthEs}, ${mapHour} horas`;
  const id = `${mapYear}-${mapMonthNum}-${mapDay} ${mapHour}:00 Mapa isobaras`;

  const feed = {
    version: "https://jsonfeed.org/version/1",
    title: "AEMET Mapa Isobaras",
    home_page_url: "https://laro.dev/aemet/isobar-map",
    feed_url: request.url,
    description: "Último mapa de isobaras de AEMET. Se actualiza dos veces al día.",
    items: [
      {
        id,
        url: "https://www.aemet.es/es/eltiempo/prediccion/mapa_frentes",
        title,
        content_html: contentHtml,
        date_published: madridPublished
      }
    ]
  };

  await env.BTC_CACHE.put(cacheKey, JSON.stringify({ timestamp: Date.now(), feed }), {
    expirationTtl: 6 * 60 * 60 // 6h
  });

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=1800"
    }
  });
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}