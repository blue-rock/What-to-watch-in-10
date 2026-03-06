export default async function handler(req, res) {
  const q = req.query.q;
  const hl = req.query.hl || 'en';

  if (!q) {
    res.status(200).json([]);
    return;
  }

  try {
    const suggestUrl = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(q)}&hl=${hl}`;
    const ytRes = await fetch(suggestUrl);
    if (!ytRes.ok) {
      res.status(200).json([]);
      return;
    }
    const text = await ytRes.text();
    const match = text.match(/\[.+\]/s);
    if (!match) {
      res.status(200).json([]);
      return;
    }
    const parsed = JSON.parse(match[0]);
    const suggestions = (parsed[1] || []).map((s) => s[0]).filter(Boolean);
    res.status(200).json(suggestions);
  } catch {
    res.status(200).json([]);
  }
}
