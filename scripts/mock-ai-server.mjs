import http from 'node:http';

const port = Number(process.env.HAVEN_AI_MOCK_PORT ?? 8787);

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (error) { reject(error); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const body = await readJson(req);
    res.setHeader('content-type', 'application/json; charset=utf-8');
    if (req.url === '/transcribe') {
      res.end(JSON.stringify({ text: body.transcript_text ?? 'Ik heb mijn pillen ingenomen.' }));
      return;
    }
    if (req.url === '/embedding') {
      const input = String(body.input ?? 'haven');
      const embedding = Array.from({ length: 1536 }, (_, i) => ((input.charCodeAt(i % input.length) || 1) % 100) / 1000);
      res.end(JSON.stringify({ embedding }));
      return;
    }
    if (req.url === '/chat') {
      const locale = body.locale === 'nl-NL' ? 'nl-NL' : 'en-GB';
      res.end(JSON.stringify({ text: locale === 'nl-NL' ? 'Ik heb u gehoord. Ik help rustig verder.' : 'I heard you. I will help calmly.' }));
      return;
    }
    if (req.url === '/tts') {
      res.end(JSON.stringify({ audio_url: null }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Unknown mock endpoint' }));
  } catch (error) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: String(error.message ?? error) }));
  }
});

server.listen(port, () => {
  console.log(`HAVEN AI mock server listening on http://127.0.0.1:${port}`);
});
