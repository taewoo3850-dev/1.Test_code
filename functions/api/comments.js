export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const photoId = url.searchParams.get('photo');

  if (!photoId) {
    return jsonResponse({ error: 'photo parameter required' }, 400);
  }

  const data = await env.KIM.get(`comments:${photoId}`);
  const comments = data ? JSON.parse(data) : [];

  return jsonResponse(comments);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const photo = (body.photo || '').toString();
  const name = (body.name || '').toString().trim();
  const message = (body.message || '').toString().trim();

  if (!photo || !name || !message) {
    return jsonResponse({ error: 'photo, name, message required' }, 400);
  }

  if (name.length > 20 || message.length > 300) {
    return jsonResponse({ error: 'Input too long' }, 400);
  }

  const key = `comments:${photo}`;
  const existingData = await env.KIM.get(key);
  const comments = existingData ? JSON.parse(existingData) : [];

  const newComment = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: name.slice(0, 20),
    message: message.slice(0, 300),
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  const trimmed = comments.slice(-500);

  await env.KIM.put(key, JSON.stringify(trimmed));

  return jsonResponse(trimmed);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
