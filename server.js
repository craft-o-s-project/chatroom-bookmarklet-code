const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const { exec } = require('child_process');
const https = require('https');

const wss = new WebSocket.Server({ noServer: true });
const server = http.createServer();

let serverVersion = ''; // Server version variable

// Load server version from JSON file when server starts
loadServerVersion();

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);

    if (data.type === 'joinServer') {
      const { username } = data;
      ws.username = username;
      sendToServer({
        type: 'userJoined',
        username: username
      });
    } else if (data.type === 'message') {
      sendToServer({
        type: 'message',
        username: ws.username,
        message: data.message
      });
    } else if (data.type === 'leaveServer') {
      sendToServer({
        type: 'userLeft',
        username: ws.username
      });
    } else if (data.type === 'getServerVersion') {
      ws.send(serverVersion);
    }
  });

  ws.on('close', function close() {
    sendToServer({
      type: 'userLeft',
      username: ws.username
    });
  });
});

function sendToServer(message) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify(message));
  });
}

function loadServerVersion() {
  try {
    const versionData = fs.readFileSync('serverVersion.json', 'utf8');
    const versionObj = JSON.parse(versionData);
    serverVersion = versionObj.version; // Set server version from JSON file
  } catch (error) {
    console.error('Failed to load server version:', error);
  }
}

function saveServerVersion(version) {
  const versionObj = { version: version };
  const versionData = JSON.stringify(versionObj);
  fs.writeFileSync('serverVersion.json', versionData, 'utf8');
}

// Create server version file if it doesn't exist
if (!fs.existsSync('serverVersion.json')) {
  saveServerVersion('1.0.0'); // Set your desired initial server version
}

server.on('request', (req, res) => {
  // Existing code
});

server.listen(8000, () => {
  console.log('Webhook server listening on port 8000');
});

// Function to download and use a new server version
function downloadAndUseServerVersion(version, serverFileUrl) {
  const serverDestinationPath = 'server.js';

  const serverFile = fs.createWriteStream(serverDestinationPath);
  https.get(serverFileUrl, response => {
    response.pipe(serverFile);
    serverFile.on('finish', () => {
      serverFile.close(() => {
        console.log(`Server code file for version ${version} downloaded.`);
        // Start the new server version
        const newServer = exec(`node ${serverDestinationPath}`);
        newServer.on('close', () => {
          console.log(`Server version ${version} is now running.`);
        });
      });
    });
  }).on('error', err => {
    console.error('Failed to download server code file:', err);
  });

  serverVersion = version; // Set the new server version

  // Update the server version file with the new version
  saveServerVersion(version);
}

// Example webhook endpoint to receive new server version
server.on('request', (req, res) => {
  const { method, url: reqUrl } = req;
  const parsedUrl = url.parse(reqUrl, true);
  const { pathname } = parsedUrl;

  if (method === 'POST' && pathname === '/webhook') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      if (data.type === 'serverVersionUpdate') {
        const newVersion = data.version;
        if (newVersion !== serverVersion) {
          const serverFileUrl = data.serverFileUrl;
          downloadAndUseServerVersion(newVersion, serverFileUrl);
          console.log(`Server version updated to ${newVersion}`);
        }
      }
      res.statusCode = 200;
      res.end();
    });
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});
