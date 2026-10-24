import http from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(ROOT, 'database', 'data.json');
const PORT = Number(process.env.PORT || 3000);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
let writeQueue = Promise.resolve();

async function readData() {
  const raw = await readFile(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);
  for (const key of ['users', 'rooms', 'bookings', 'tokens']) data[key] ??= [];
  return data;
}

async function writeData(data) {
  writeQueue = writeQueue.then(async () => {
    await mkdir(path.dirname(DATA_FILE), { recursive: true });
    const temp = `${DATA_FILE}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(temp, DATA_FILE);
  });
  return writeQueue;
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
  }
  if (!raw.trim()) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 }); }
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function currentUser(data, req) {
  const token = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const entry = data.tokens.find((item) => item.token === token);
  return entry ? data.users.find((user) => Number(user.id) === Number(entry.userId)) || null : null;
}

function requireUser(data, req) {
  const user = currentUser(data, req);
  if (!user) throw Object.assign(new Error('Authentication required.'), { status: 401 });
  return user;
}

function requireOwner(data, req) {
  const user = requireUser(data, req);
  if (user.role !== 'owner') throw Object.assign(new Error('Owner access required.'), { status: 403 });
  return user;
}

function nextId(items) { return items.length ? Math.max(...items.map((item) => Number(item.id) || 0)) + 1 : 1; }
function roomById(data, id) { return data.rooms.find((room) => Number(room.id) === Number(id)); }
function userById(data, id) { return data.users.find((user) => Number(user.id) === Number(id)); }

function bookingView(data, booking) {
  const user = userById(data, booking.userId);
  const room = roomById(data, booking.roomId);
  return { ...booking, customer: user?.name || 'Unknown customer', customerEmail: user?.email || '', room: room?.name || 'Unknown room', roomPrice: Number(room?.price || 0), image: room?.image || '', total: Math.round(Number(room?.price || 0) * Number(booking.duration || 1) * 100) / 100 };
}

function validateBooking(data, payload, ignoreId = null) {
  const roomId = Number(payload.roomId);
  const date = String(payload.date || '').trim();
  const time = String(payload.time || '').trim();
  const duration = Number(payload.duration ?? 1);
  if (!roomId || !roomById(data, roomId)) throw Object.assign(new Error('Selected room does not exist.'), { status: 422 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) throw Object.assign(new Error('Invalid booking date.'), { status: 422 });
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Object.assign(new Error('Invalid booking time.'), { status: 422 });
  if (!Number.isFinite(duration) || duration <= 0 || duration > 12) throw Object.assign(new Error('Invalid booking duration.'), { status: 422 });
  const start = new Date(`${date}T${time}:00+08:00`).getTime();
  const end = start + duration * 3600000;
  for (const existing of data.bookings) {
    if (Number(existing.id) === Number(ignoreId) || Number(existing.roomId) !== roomId || existing.date !== date || existing.status === 'cancelled') continue;
    const existingStart = new Date(`${existing.date}T${existing.time}:00+08:00`).getTime();
    const existingEnd = existingStart + Number(existing.duration || 1) * 3600000;
    if (start < existingEnd && end > existingStart) throw Object.assign(new Error('That room and time is already unavailable.'), { status: 409 });
  }
  return { roomId, date, time, duration };
}

async function api(req, res, url) {
  const route = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const method = req.method.toUpperCase();
  const data = await readData();
  const payload = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? await body(req) : {};
  let match;

  if (route === 'auth/session' && method === 'GET') return send(res, 200, { authenticated: Boolean(currentUser(data, req)), user: publicUser(currentUser(data, req)) });
  if (route === 'auth/login' && method === 'POST') {
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const user = data.users.find((item) => item.email.toLowerCase() === email && bcrypt.compareSync(password, item.password));
    if (!user) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
    const token = crypto.randomBytes(32).toString('hex');
    data.tokens = data.tokens.filter((item) => Number(item.userId) !== Number(user.id));
    data.tokens.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    await writeData(data);
    return send(res, 200, { user: publicUser(user), token });
  }
  if (route === 'auth/logout' && method === 'POST') {
    const token = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
    data.tokens = data.tokens.filter((item) => item.token !== token);
    await writeData(data);
    return send(res, 200, { message: 'Logged out successfully.' });
  }
  if (route === 'users/register' && method === 'POST') {
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const role = payload.role === 'owner' ? 'owner' : 'drummer';
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) throw Object.assign(new Error('Please provide a valid name, email, and password of at least 8 characters.'), { status: 422 });
    if (data.users.some((user) => user.email.toLowerCase() === email)) throw Object.assign(new Error('That email address is already registered.'), { status: 409 });
    const user = { id: nextId(data.users), name, email, password: bcrypt.hashSync(password, 10), role, phone: '', createdAt: new Date().toISOString() };
    const token = crypto.randomBytes(32).toString('hex');
    data.users.push(user); data.tokens.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    await writeData(data);
    return send(res, 201, { user: publicUser(user), token });
  }
  if (route === 'users/profile' && ['GET', 'PUT', 'DELETE'].includes(method)) {
    const user = requireUser(data, req);
    if (method === 'GET') return send(res, 200, { user: publicUser(user) });
    if (method === 'PUT') {
      const name = String(payload.name ?? user.name).trim(); const email = String(payload.email ?? user.email).trim().toLowerCase(); const phone = String(payload.phone ?? user.phone ?? '').trim();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error('Please provide a valid name and email.'), { status: 422 });
      if (data.users.some((other) => other.id !== user.id && other.email.toLowerCase() === email)) throw Object.assign(new Error('That email address is already in use.'), { status: 409 });
      Object.assign(user, { name, email, phone }); await writeData(data); return send(res, 200, { user: publicUser(user) });
    }
    data.users = data.users.filter((item) => item.id !== user.id);
    for (const booking of data.bookings) if (Number(booking.userId) === Number(user.id) && booking.status !== 'cancelled') booking.status = 'cancelled';
    data.tokens = data.tokens.filter((item) => Number(item.userId) !== Number(user.id));
    await writeData(data); return send(res, 200, { message: 'Account deleted.' });
  }
  if (route === 'rooms' && method === 'GET') return send(res, 200, { rooms: data.rooms });
  if (route === 'rooms' && method === 'POST') {
    requireOwner(data, req);
    const name = String(payload.name || '').trim(); const price = Number(payload.price || 0); const capacity = Number(payload.capacity || 0);
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(capacity) || capacity < 1) throw Object.assign(new Error('Invalid room data.'), { status: 422 });
    const room = { id: nextId(data.rooms), name, price, capacity, equipment: String(payload.equipment || '').trim(), image: String(payload.image || '') };
    data.rooms.push(room); await writeData(data); return send(res, 201, { room });
  }
  if ((match = route.match(/^rooms\/(\d+)$/)) && ['PUT', 'DELETE'].includes(method)) {
    requireOwner(data, req); const id = Number(match[1]); const room = roomById(data, id);
    if (!room) throw Object.assign(new Error('Room not found.'), { status: 404 });
    if (method === 'PUT') {
      Object.assign(room, { name: String(payload.name ?? room.name).trim(), price: Number(payload.price ?? room.price), capacity: Number(payload.capacity ?? room.capacity), equipment: String(payload.equipment ?? room.equipment).trim() });
      if (payload.image) room.image = String(payload.image);
      await writeData(data); return send(res, 200, { room });
    }
    if (data.bookings.some((booking) => Number(booking.roomId) === id && booking.status !== 'cancelled')) throw Object.assign(new Error('This room cannot be deleted while it has active bookings.'), { status: 409 });
    data.rooms = data.rooms.filter((item) => Number(item.id) !== id); await writeData(data); return send(res, 200, { message: 'Room deleted.' });
  }
  if (route === 'bookings/availability' && method === 'GET') {
    requireUser(data, req); const roomId = Number(url.searchParams.get('roomId')); const date = url.searchParams.get('date') || '';
    if (!roomById(data, roomId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Object.assign(new Error('Invalid availability request.'), { status: 422 });
    return send(res, 200, { bookedTimes: [...new Set(data.bookings.filter((booking) => Number(booking.roomId) === roomId && booking.date === date && booking.status !== 'cancelled').map((booking) => booking.time))] });
  }
  if (route === 'bookings' && ['GET', 'POST'].includes(method)) {
    const user = requireUser(data, req);
    if (method === 'GET') {
      let items = data.bookings;
      if (user.role !== 'owner') items = items.filter((booking) => Number(booking.userId) === Number(user.id));
      items.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      return send(res, 200, { bookings: items.map((booking) => bookingView(data, booking)) });
    }
    const validated = validateBooking(data, payload);
    const booking = { id: nextId(data.bookings), userId: user.id, ...validated, status: 'pending', payment: 'Pending', createdAt: new Date().toISOString() };
    data.bookings.push(booking); await writeData(data); return send(res, 201, { booking: bookingView(data, booking) });
  }
  if ((match = route.match(/^bookings\/(\d+)$/)) && ['GET', 'PUT', 'DELETE'].includes(method)) {
    const user = requireUser(data, req); const id = Number(match[1]); const booking = data.bookings.find((item) => Number(item.id) === id);
    if (!booking) throw Object.assign(new Error('Booking not found.'), { status: 404 });
    if (method === 'GET') {
      if (user.role !== 'owner' && Number(booking.userId) !== Number(user.id)) throw Object.assign(new Error('You cannot view this booking.'), { status: 403 });
      return send(res, 200, { booking: bookingView(data, booking) });
    }
    if (user.role !== 'owner' && Number(booking.userId) !== Number(user.id)) throw Object.assign(new Error(method === 'DELETE' ? 'You cannot cancel this booking.' : 'You cannot modify this booking.'), { status: 403 });
    if (method === 'DELETE') { booking.status = 'cancelled'; booking.payment = 'Refunded'; await writeData(data); return send(res, 200, { message: 'Booking cancelled.', booking: bookingView(data, booking) }); }
    if ('status' in payload && user.role !== 'owner') throw Object.assign(new Error('Only the owner can change booking status.'), { status: 403 });
    if (['roomId', 'date', 'time', 'duration'].some((key) => key in payload)) Object.assign(booking, validateBooking(data, { ...booking, ...payload }, id));
    if (user.role === 'owner' && 'status' in payload) {
      if (!['pending', 'approved', 'cancelled'].includes(payload.status)) throw Object.assign(new Error('Invalid booking status.'), { status: 422 });
      booking.status = payload.status; booking.payment = payload.status === 'approved' ? 'Paid' : payload.status === 'cancelled' ? 'Refunded' : 'Pending';
    }
    await writeData(data); return send(res, 200, { booking: bookingView(data, booking) });
  }
  throw Object.assign(new Error('API route not found.'), { status: 404 });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { message: 'Method not allowed.' });
    let pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.resolve(ROOT, `.${pathname}`);
    if (pathname.startsWith('/database/') || pathname.startsWith('/.')) return send(res, 403, { message: 'Forbidden.' });
    if (!filePath.startsWith(`${ROOT}${path.sep}`) && filePath !== path.join(ROOT, 'index.html')) return send(res, 403, { message: 'Forbidden.' });
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    const status = error.status || (error.code === 'ENOENT' ? 404 : 500);
    if (status === 500) console.error(error);
    send(res, status, { message: status === 404 ? 'Resource not found.' : error.message || 'Internal server error.' });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`BeatBase is running at http://localhost:${PORT}`));
