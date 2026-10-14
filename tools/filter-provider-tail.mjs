// Never print request URLs, cookies, reset tokens, email addresses or raw tail events.
let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buffer += chunk;
  for (;;) {
    const start = buffer.indexOf('{');
    if (start < 0) { buffer = ''; return; }
    if (start) buffer = buffer.slice(start);
    let end = buffer.indexOf('\n}');
    if (end < 0) return;
    const raw = buffer.slice(0, end + 2);
    buffer = buffer.slice(end + 2);
    try {
      const event = JSON.parse(raw);
      for (const log of event.logs || []) {
        const args = log.message || [];
        if (args[0] === 'RECOVERY_PROVIDER_REJECTED') console.log('Recovery provider:', Number(args[1]), /^[a-z_]{1,40}$/.test(args[2]) ? args[2] : 'unknown');
        if (args[0] === 'server media upload failed') {
          const text = JSON.stringify(args.slice(1));
          const known = text.match(/IMAGEKIT_[A-Z_]+(?::\d{3})?|MEDIA_[A-Z_]+|INVALID_MEDIA|fetch failed|timeout|R2[^"\n]{0,40}/);
          console.log('Media provider:', known ? known[0] : 'unclassified failure');
        }
      }
    } catch { /* discard malformed events rather than exposing raw data */ }
  }
});
