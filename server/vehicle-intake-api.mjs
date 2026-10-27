import http from 'node:http';

const PORT = Number(process.env.PORT || 3001);
const savedVehicles = [];

const send = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  response.end(JSON.stringify(body));
};

const server = http.createServer((request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {});
  if (request.method === 'GET' && request.url === '/api/health') return send(response, 200, { status: 'ok', service: 'trustcar-vehicle-intake' });
  if (request.method === 'GET' && request.url === '/api/cpo/vehicles') return send(response, 200, { data: savedVehicles });
  if (request.method === 'POST' && request.url === '/api/cpo/vehicles') {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload.licensePlate || !payload.vin || !payload.checklist) return send(response, 400, { message: 'Thiếu dữ liệu hồ sơ bắt buộc.' });
        const record = { id: `CPO-${String(savedVehicles.length + 1).padStart(4, '0')}`, ...payload, createdAt: new Date().toISOString() };
        savedVehicles.unshift(record);
        return send(response, 201, { data: record });
      } catch {
        return send(response, 400, { message: 'Payload không hợp lệ.' });
      }
    });
    return;
  }
  return send(response, 404, { message: 'Không tìm thấy endpoint.' });
});

server.listen(PORT, () => console.log(`TrustCar API listening at http://localhost:${PORT}`));
