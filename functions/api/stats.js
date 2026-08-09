const PHOTO_IDS = ['photo-1', 'photo-2', 'photo-3'];

export async function onRequestGet(context) {
  const { env } = context;

  const results = {};

  for (const photoId of PHOTO_IDS) {
    const [commentsData, likesData] = await Promise.all([
      env.KIM.get(`comments:${photoId}`),
      env.KIM.get(`likes:${photoId}`)
    ]);
    const comments = commentsData ? JSON.parse(commentsData) : [];
    const likes = likesData ? parseInt(likesData, 10) : 0;
    results[photoId] = { comments: comments.length, likes };
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
