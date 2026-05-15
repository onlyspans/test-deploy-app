process.title = 'onlyspans-test-deploy-app';

const http = require('http');

const port = Number.parseInt(process.env.PORT || '3050', 10);
const host = '0.0.0.0';

/** Log interval in ms (set `HEARTBEAT_INTERVAL_MS=0` to disable). */
const heartbeatMs = Number.parseInt(process.env.HEARTBEAT_INTERVAL_MS || '1000', 10);
const startedAt = Date.now();
let heartbeatTick = 0;

/** Custom line on `/` (set e.g. `TEST_DEPLOY_MESSAGE=staging-42` in the environment). */
const pageMessage = (process.env.TEST_DEPLOY_MESSAGE || '').trim();

/** @param {{ title: string; subtitle?: string; badge?: string; pageMessage?: string }} opts */
function pageShell(opts) {
  const {
    title,
    subtitle = 'Smoke container for deploy pipelines.',
    badge = 'live',
    pageMessage: line = '',
  } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #0c0d10;
      --surface: #14161c;
      --border: rgba(255, 255, 255, 0.08);
      --text: #e8eaef;
      --muted: #8b92a6;
      --accent: #6ee7b7;
      --accent-dim: rgba(110, 231, 183, 0.15);
      --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --mono: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--font);
      color: var(--text);
      background:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(110, 231, 183, 0.12), transparent),
        var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .wrap {
      width: 100%;
      max-width: 28rem;
      position: relative;
    }
    .wrap::before {
      content: "";
      position: absolute;
      inset: -1px;
      border-radius: 1rem;
      padding: 1px;
      background: linear-gradient(135deg, rgba(110, 231, 183, 0.5), rgba(255, 255, 255, 0.06), rgba(110, 231, 183, 0.25));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
    .card {
      position: relative;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.75rem 1.5rem;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.45);
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .logo {
      font-family: var(--mono);
      font-size: 0.7rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .badge {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent);
      background: var(--accent-dim);
      border: 1px solid rgba(110, 231, 183, 0.35);
      padding: 0.25rem 0.5rem;
      border-radius: 999px;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 600;
      line-height: 1.25;
      margin: 0 0 0.5rem;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.55;
      color: var(--muted);
    }
    .meta {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
      font-family: var(--mono);
      font-size: 0.72rem;
      color: var(--muted);
      display: grid;
      gap: 0.35rem;
    }
    .meta kbd {
      color: var(--text);
      background: rgba(255, 255, 255, 0.06);
      padding: 0.1rem 0.35rem;
      border-radius: 0.25rem;
      border: 1px solid var(--border);
    }
    .env-line {
      margin-top: 1rem;
      padding: 0.65rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(110, 231, 183, 0.25);
      background: rgba(110, 231, 183, 0.06);
      font-family: var(--mono);
      font-size: 0.78rem;
      line-height: 1.45;
      color: var(--accent);
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <article class="card">
      <div class="row">
        <span class="logo">onlyspans · test</span>
        <span class="badge">${escapeHtml(badge)}</span>
      </div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      ${line ? `<p class="env-line" role="status">${escapeHtml(line)}</p>` : ''}
      <div class="meta">
        <span><kbd>GET</kbd> /health — JSON probe</span>
        <span>Node ${escapeHtml(process.version)} · ${escapeHtml(new Date().toISOString())}</span>
      </div>
    </article>
  </div>
</body>
</html>`;
}

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'healthy', ts: new Date().toISOString() }));
    return;
  }
  if (path === '/') {
    const html = pageShell({
      title: 'Deploy app is up Привет Мир!',
      subtitle: 'If you see this page, routing and the container runtime look good.',
      badge: 'ok',
      pageMessage,
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found\n');
});

/** @type {ReturnType<typeof setInterval> | undefined} */
let heartbeatInterval;

function logHeartbeat() {
  heartbeatTick += 1;
  const rssMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  const uptimeS = Math.floor((Date.now() - startedAt) / 1000);
  console.log(
    `[heartbeat] tick=${heartbeatTick} uptime_s=${uptimeS} rss_mb=${rssMb} port=${port} pid=${process.pid}`,
  );
}

function stopHeartbeat() {
  if (heartbeatInterval !== undefined) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = undefined;
  }
}

server.listen(port, host, () => {
  console.log(`listening on http://${host}:${port}`);
  if (heartbeatMs > 0) {
    logHeartbeat();
    heartbeatInterval = setInterval(logHeartbeat, heartbeatMs);
  }
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) {
    console.log(`shutdown: ${signal} (force exit)`);
    process.exit(0);
  }
  shuttingDown = true;
  console.log(`shutdown: ${signal}`);
  stopHeartbeat();

  server.close((err) => {
    if (err) {
      console.error(err);
    }
    process.exit(0);
  });

  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  } else if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }

  setTimeout(() => {
    console.error('shutdown: timeout, exiting');
    process.exit(0);
  }, 2000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
