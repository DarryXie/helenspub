import { spawn } from 'node:child_process';
import net from 'node:net';

const isWindows = process.platform === 'win32';
const windowsShell = process.env.ComSpec || 'cmd.exe';

function canListenOnHost(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error && error.code === 'EAFNOSUPPORT') {
        resolve(true);
        return;
      }

      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function canListen(port) {
  const [ipv4Free, ipv6LoopbackFree, ipv6WildcardFree] = await Promise.all([
    canListenOnHost(port, '127.0.0.1'),
    canListenOnHost(port, '::1'),
    canListenOnHost(port, '::'),
  ]);

  return ipv4Free && ipv6LoopbackFree && ipv6WildcardFree;
}

async function findAvailablePort(startPort, reservedPorts = new Set()) {
  let port = startPort;

  while (reservedPorts.has(port) || !(await canListen(port))) {
    port += 1;
  }

  reservedPorts.add(port);
  return port;
}

function createCorepackProcess(name, args, env, cwd = process.cwd()) {
  if (isWindows) {
    return {
      name,
      command: windowsShell,
      args: ['/d', '/s', '/c', `corepack ${args.join(' ')}`],
      cwd,
      env,
    };
  }

  return {
    name,
    command: 'corepack',
    args,
    cwd,
    env,
  };
}

const children = [];

function prefixOutput(name, stream, target) {
  stream.on('data', (chunk) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (!line) {
        continue;
      }

      target.write(`[${name}] ${line}\n`);
    }
  });
}

function shutdown(exitCode = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 300);
}

async function main() {
  const reservedPorts = new Set();
  const gatewayStartPort = Number(process.env.LOCAL_GATEWAY_PORT || 8080);
  const gatewayPort = await findAvailablePort(gatewayStartPort, reservedPorts);
  const adminPort = await findAvailablePort(5173, reservedPorts);
  const menuPort = await findAvailablePort(5174, reservedPorts);
  const staffPort = await findAvailablePort(5175, reservedPorts);
  const apiPort = 3000;
  const shouldStartApi = await canListen(apiPort);
  const gatewayOrigin = `http://localhost:${gatewayPort}`;

  const processes = [
    {
      name: 'gateway',
      command: process.execPath,
      args: ['scripts/dev/path-gateway.mjs'],
      env: {
        ...process.env,
        LOCAL_GATEWAY_PORT: String(gatewayPort),
        LOCAL_GATEWAY_HOST: 'localhost',
        LOCAL_PROXY_HOST: 'localhost',
        ADMIN_DEV_PORT: String(adminPort),
        MENU_DEV_PORT: String(menuPort),
        STAFF_DEV_PORT: String(staffPort),
        API_DEV_PORT: String(apiPort),
      },
    },
    createCorepackProcess(
      'admin',
      ['pnpm', 'exec', 'vite', '--host', 'localhost', '--strictPort', '--port', String(adminPort), '--base', '/admin/'],
      {
        ...process.env,
        VITE_API_BASE_URL: `${gatewayOrigin}/api/v1`,
        VITE_API_ORIGIN: gatewayOrigin,
      },
      'D:\\CodeX\\cocktail_database\\apps\\admin-web',
    ),
    createCorepackProcess(
      'menu',
      ['pnpm', 'exec', 'vite', '--host', 'localhost', '--strictPort', '--port', String(menuPort), '--base', '/menu/'],
      {
        ...process.env,
        VITE_API_BASE_URL: `${gatewayOrigin}/api/v1`,
        VITE_API_ORIGIN: gatewayOrigin,
      },
      'D:\\CodeX\\cocktail_database\\apps\\public-mobile',
    ),
    createCorepackProcess(
      'staff',
      ['pnpm', 'exec', 'vite', '--host', 'localhost', '--strictPort', '--port', String(staffPort), '--base', '/staff/'],
      {
        ...process.env,
        VITE_API_BASE_URL: `${gatewayOrigin}/api/v1`,
        VITE_API_ORIGIN: gatewayOrigin,
      },
      'D:\\CodeX\\cocktail_database\\apps\\staff-mobile',
    ),
  ];

  if (shouldStartApi) {
    processes.splice(
      1,
      0,
      createCorepackProcess('api', ['pnpm', '--filter', 'api-server', 'run', 'start:dev'], process.env),
    );
  } else {
    console.log(`[api] Reusing existing API on http://localhost:${apiPort}`);
  }

  console.log(`Local path-mode dev is starting. Open ${gatewayOrigin}/menu`);
  console.log(
    `Assigned ports: gateway=${gatewayPort}, admin=${adminPort}, menu=${menuPort}, staff=${staffPort}, api=${apiPort}`,
  );

  for (const proc of processes) {
    let child;

    try {
      child = spawn(proc.command, proc.args, {
        cwd: proc.cwd || process.cwd(),
        env: proc.env,
        shell: false,
      });
    } catch (error) {
      console.error(`[${proc.name}] failed to start: ${error.message}`);
      shutdown(1);
      return;
    }

    children.push(child);
    prefixOutput(proc.name, child.stdout, process.stdout);
    prefixOutput(proc.name, child.stderr, process.stderr);

    child.on('error', (error) => {
      console.error(`[${proc.name}] process error: ${error.message}`);
      shutdown(1);
    });

    child.on('exit', (code) => {
      if (code && code !== 0) {
        console.error(`[${proc.name}] exited with code ${code}`);
        shutdown(code);
      }
    });
  }
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

await main();
