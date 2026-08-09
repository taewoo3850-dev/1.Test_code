export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const photo = (body.photo || '').toString();
  const action = (body.action || '').toString();

  if (!photo || (action !== 'like' && action !== 'unlike')) {
    return jsonResponse({ error: 'photo and valid action required' }, 400);
  }

  const key = `likes:${photo}`;
  const current = await env.KIM.get(key);
  let count = current ? parseInt(current, 10) : 0;

  if (action === 'like') {
    count += 1;
  } else {
    count = Math.max(0, count - 1);
  }

  await env.KIM.put(key, count.toString());

  return jsonResponse({ likes: count });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
