export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const photoId = url.searchParams.get('photo');

  if (!photoId) {
    return jsonResponse({ error: 'photo parameter required' }, 400);
  }

  const comments = await getComments(env, photoId);
  return jsonResponse(stripTokens(comments));
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

  const comments = await getComments(env, photo);
  const editToken = crypto.randomUUID();

  const newComment = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: name.slice(0, 20),
    message: message.slice(0, 300),
    createdAt: new Date().toISOString(),
    editToken
  };

  comments.push(newComment);
  const trimmed = comments.slice(-500);

  await saveComments(env, photo, trimmed);

  return jsonResponse({
    comments: stripTokens(trimmed),
    newCommentId: newComment.id,
    editToken
  });
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const photo = (body.photo || '').toString();
  const id = (body.id || '').toString();
  const editToken = (body.editToken || '').toString();

  if (!photo || !id || !editToken) {
    return jsonResponse({ error: 'photo, id, editToken required' }, 400);
  }

  const comments = await getComments(env, photo);
  const target = comments.find((c) => c.id === id);

  if (!target) {
    return jsonResponse({ error: 'Comment not found' }, 404);
  }

  if (target.editToken !== editToken) {
    return jsonResponse({ error: 'Not authorized to delete this comment' }, 403);
  }

  const filtered = comments.filter((c) => c.id !== id);
  await saveComments(env, photo, filtered);

  return jsonResponse(stripTokens(filtered));
}

async function getComments(env, photoId) {
  const data = await env.KIM.get(`comments:${photoId}`);
  return data ? JSON.parse(data) : [];
}

async function saveComments(env, photoId, comments) {
  await env.KIM.put(`comments:${photoId}`, JSON.stringify(comments));
}

function stripTokens(comments) {
  return comments.map(({ id, name, message, createdAt }) => ({ id, name, message, createdAt }));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
