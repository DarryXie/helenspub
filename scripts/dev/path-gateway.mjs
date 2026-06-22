import http from 'node:http';
import net from 'node:net';

const gatewayPort = Number(process.env.LOCAL_GATEWAY_PORT || 8080);
const gatewayHost = process.env.LOCAL_GATEWAY_HOST || '127.0.0.1';
const upstreamHost = process.env.LOCAL_PROXY_HOST || 'localhost';
const adminPort = Number(process.env.ADMIN_DEV_PORT || 5173);
const menuPort = Number(process.env.MENU_DEV_PORT || 5174);
const staffPort = Number(process.env.STAFF_DEV_PORT || 5175);
const apiPort = Number(process.env.API_DEV_PORT || 3000);

const routes = [
  { prefix: '/admin', port: adminPort },
  { prefix: '/menu', port: menuPort },
  { prefix: '/staff', port: staffPort },
  { prefix: '/api', port: apiPort },
  { prefix: '/uploads', port: apiPort },
];

function findRoute(url = '/') {
  return routes.find(
    (route) => url === route.prefix || url.startsWith(`${route.prefix}/`),
  );
}

function redirectTo(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function proxyHttp(req, res, targetPort) {
  const proxyReq = http.request(
    {
      hostname: upstreamHost,
      family: 0,
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${upstreamHost}:${targetPort}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Proxy error for ${req.url}: ${error.message}`);
  });

  req.pipe(proxyReq);
}

function proxyUpgrade(req, socket, head, targetPort) {
  const upstream = net.connect(targetPort, upstreamHost, () => {
    const headerLines = Object.entries(req.headers).flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => `${key}: ${item}`);
      }

      return value === undefined ? [] : [`${key}: ${value}`];
    });

    upstream.write(
      [
        `${req.method} ${req.url} HTTP/${req.httpVersion}`,
        ...headerLines,
        '',
        '',
      ].join('\r\n'),
    );

    if (head.length > 0) {
      upstream.write(head);
    }

    socket.pipe(upstream).pipe(socket);
  });

  upstream.on('error', () => {
    socket.destroy();
  });

  socket.on('error', () => {
    upstream.destroy();
  });
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/') {
    redirectTo(res, '/menu');
    return;
  }

  if (url === '/admin' || url === '/menu' || url === '/staff') {
    redirectTo(res, `${url}/`);
    return;
  }

  const route = findRoute(url);

  if (!route) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`No local route configured for ${url}`);
    return;
  }

  proxyHttp(req, res, route.port);
});

server.on('upgrade', (req, socket, head) => {
  const route = findRoute(req.url || '/');

  if (!route) {
    socket.destroy();
    return;
  }

  proxyUpgrade(req, socket, head, route.port);
});

server.listen(gatewayPort, gatewayHost, () => {
  console.log(`Local path gateway running at http://${gatewayHost}:${gatewayPort}`);
  console.log(
    `Routes: /admin -> ${adminPort}, /menu -> ${menuPort}, /staff -> ${staffPort}, /api -> ${apiPort}, /uploads -> ${apiPort}`,
  );
});
