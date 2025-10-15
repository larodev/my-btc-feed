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

    // 🪙 Handle favicon requests
    if (url.pathname === "/favicon.ico") {
      // Example: 16x16 orange circle icon (base64-encoded .ico)
      const faviconBase64 =
        "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMTcgMjQiIGZpbGw9IiMwMDAwMDAiPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik0xNi4wMjQgNy4zODVhMy40MiAzLjQyIDAgMCAxLTEuODcgMy43MTJsLS4wMi4wMDlhNC4zMzggNC4zMzggMCAwIDEgMi41MTggMS40NzlsLjAwNi4wMDdjLjQ0NS42NjQuNzExIDEuNDgxLjcxMSAyLjM2YzAgLjI1Ni0uMDIzLjUwOC0uMDY2Ljc1MmwuMDA0LS4wMjZhNS40MjEgNS40MjEgMCAwIDEtLjQ4MyAxLjgzN2wuMDE0LS4wMzRhMy45ODggMy45ODggMCAwIDEtLjkyOCAxLjI3N2wtLjAwMy4wMDNhNC43MTIgNC43MTIgMCAwIDEtMS4zNjcuODMzbC0uMDMyLjAxMWE4LjE3MyA4LjE3MyAwIDAgMS0xLjcwMi40OWwtLjA1MS4wMDhjLS42MDYuMTA2LTEuMzI4LjE4My0yLjA2Mi4yMTVsLS4wMzYuMDAxdjMuNjgySDguNDM2di0zLjYycS0xLjE1NCAwLTEuNzYtLjAxNHYzLjYzNEg0LjQ1NXYtMy42OHEtLjI2IDAtLjc3OS0uMDA3dC0uNzk0LS4wMDdILS4wMDFsLjQ0Ny0yLjY0aDEuNmEuNzcxLjc3MSAwIDAgMCAuODM3LS43MzR2LTUuOGguMjNhMS40NjYgMS40NjYgMCAwIDAtLjIwNi0uMDE1aC0uMDI1aC4wMDFWNi45NzlhMS4xNDggMS4xNDggMCAwIDAtMS4yOS0uOTc4TDEuNTk5IDZoLTEuNlYzLjYzNGwzLjA1OC4wMTRxLjkyMyAwIDEuMzk5LS4wMTRWMGgyLjIyMXYzLjU2MnExLjE4Mi0uMDI5IDEuNzYtLjAyOVYtLjAwMWgyLjIyMXYzLjYzNGMuNzUxLjA2MSAxLjQ0LjE3NiAyLjEwOC4zNDRsLS4wODktLjAxOWE2LjUzNSA2LjUzNSAwIDAgMSAxLjY2Mi42NjZsLS4wMzItLjAxN2MuNDg5LjI3NS44OS42NTUgMS4xODIgMS4xMTJsLjAwOC4wMTNhMy42NCAzLjY0IDAgMCAxIC41MjcgMS42NGwuMDAxLjAxMnptLTMuMTAxIDcuODYxdi0uMDM4YzAtLjMyNC0uMDgtLjYyOC0uMjIxLS44OTZsLjAwNS4wMWEyLjE2NSAyLjE2NSAwIDAgMC0uNTMtLjY2bC0uMDAzLS4wMDNhMi43MSAyLjcxIDAgMCAwLS44MS0uNDM0bC0uMDE5LS4wMDZhNi41MzYgNi41MzYgMCAwIDAtLjg5OC0uMjU5bC0uMDQ2LS4wMDhhOC4wMSA4LjAxIDAgMCAwLTEuMDQ0LS4xMjhsLS4wMjMtLjAwMXEtLjYzNC0uMDQzLS45OTUtLjA0M3QtLjkzLjAxNHQtLjY4NS4wMTR2NC44NzJxLjExNSAwIC41MzQuMDA3dC42OTIuMDA3dC43NjUtLjAyMnQuODQ0LS4wNTh0LjgyMi0uMTIyYy4zMS0uMDU0LjU3OS0uMTI0LjgzOS0uMjEzbC0uMDM5LjAxMmMuMjY4LS4wOTYuNDk0LS4xOTguNzEtLjMxNmwtLjAyNi4wMTNjLjIyMS0uMTE0LjQxLS4yNTkuNTY4LS40MzFsLjAwMS0uMDAxYy4xNDQtLjE2NC4yNjMtLjM1NS4zNDktLjU2M2wuMDA1LS4wMTRhMS44OCAxLjg4IDAgMCAwIC4xMzYtLjcwOHYtLjAyN3YuMDAxek0xMS44OTkgOC4zOHYtLjAzN2MwLS4yOTMtLjA2Ny0uNTctLjE4NS0uODE4bC4wMDUuMDExYTIuMDI1IDIuMDI1IDAgMCAwLS40MzktLjYwNWwtLjAwMS0uMDAxYTIuMTQxIDIuMTQxIDAgMCAwLS42NzctLjM5NWwtLjAxNS0uMDA1YTQuNzA2IDQuNzA2IDAgMCAwLS43NjEtLjIzNGwtLjAzMy0uMDA2YTcuNDMxIDcuNDMxIDAgMCAwLS44NjEtLjExNGwtLjAyNy0uMDAycS0uNTI2LS4wNDMtLjgzNy0uMDM2dC0uNzc5LjAxNHQtLjU3LjAwN3Y0LjQyOGwuNDk4LjAwN3EuNDI2LjAwNy42NyAwdC43Mi0uMDI5YTYuMTIgNi4xMiAwIDAgMCAuODMtLjA4NWwtLjAzNi4wMDVxLjMyLS4wNTguNzQyLS4xNmMuMjY0LS4wNTguNDk4LS4xNS43MTEtLjI3M2wtLjAxMi4wMDZhMy45NSAzLjk1IDAgMCAwIC41MzgtLjM5NGwtLjAwNS4wMDRhMS4zOCAxLjM4IDAgMCAwIC4zODYtLjU0NmwuMDAzLS4wMDljLjA4NC0uMjEyLjEzMi0uNDU4LjEzMi0uNzE1di0uMDIxdi4wMDF6Ii8+PC9zdmc+";

      const binary = Uint8Array.from(atob(faviconBase64), c => c.charCodeAt(0));
      return new Response(binary, {
        headers: {
          "content-type": "image/svg+xml",
          "cache-control": "public, max-age=86400"
        }
      });
    }

    // 👉 all other requests go to your main feed logic
    return handleFeedRequest(request, env);
  },
};

// Move your existing feed logic here
async function handleFeedRequest(request: Request, env: Env): Promise<Response> {
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


