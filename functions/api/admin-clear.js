const PHOTO_IDS = ['photo-1', 'photo-2', 'photo-3'];

export async function onRequestPost(context) {
  const { env } = context;

  for (const photoId of PHOTO_IDS) {
    await env.KIM.delete(`comments:${photoId}`);
    await env.KIM.delete(`likes:${photoId}`);
  }

  return new Response(JSON.stringify({ cleared: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
