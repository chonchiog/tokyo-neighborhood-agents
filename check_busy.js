// Check live status + queue estimate using Google Places API (New)
// Analyzes reviews for queue mentions + considers time/day to predict busyness
//
// Usage: node check_busy.js "place 1" "place 2" ...
// Requires: GOOGLE_MAPS_API_KEY in .env or environment

const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) { console.error('Set GOOGLE_MAPS_API_KEY in .env'); process.exit(1); }

const QUEUE_RE = /queue|wait|line|lined up|busy|crowd|packed|full|long wait|minute wait|hour wait/i;
const NO_QUEUE_RE = /no queue|no wait|no line|walk.?right.?in|empty|no crowd|seat.?right.?away|immediately/i;

function searchPlace(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      textQuery: query,
      languageCode: 'en',
      maxResultCount: 1,
      locationBias: { circle: { center: { latitude: 35.6461, longitude: 139.7106 }, radius: 15000 } }
    });
    const req = https.request({
      hostname: 'places.googleapis.com', path: '/v1/places:searchText', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber,places.googleMapsLinks,places.businessStatus,places.reservable,places.priceRange,places.reviews',
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function analyzeQueue(place) {
  const reviews = place.reviews || [];
  const reservable = place.reservable || false;
  const reviewCount = place.userRatingCount || 0;
  let queueMentions = 0, noQueueMentions = 0;
  const snippets = [];

  for (const r of reviews) {
    const text = (r.text?.text || '');
    if (!text) continue;
    if (text.match(NO_QUEUE_RE)) { noQueueMentions++; }
    else if (text.match(QUEUE_RE)) {
      queueMentions++;
      for (const s of text.split(/[.!。]+/)) {
        if (s.match(QUEUE_RE) && s.trim().length > 10) {
          snippets.push(s.trim().substring(0, 120));
          break;
        }
      }
    }
  }

  const now = new Date();
  const jstHour = (now.getUTCHours() + 9) % 24;
  const isPeak = (jstHour >= 11 && jstHour <= 13) || (jstHour >= 18 && jstHour <= 20);
  const isWeekend = [0, 6].includes(now.getUTCDay());

  let level, emoji;
  if (reservable) {
    level = 'RESERVABLE — call to book'; emoji = '✅';
  } else if (reviewCount > 3000 && queueMentions >= 2 && isPeak) {
    level = 'EXPECT QUEUE' + (isWeekend ? ' (weekend rush)' : ' (peak hour)'); emoji = '🔴';
  } else if (queueMentions >= 2 && isPeak) {
    level = 'LIKELY QUEUE'; emoji = '🟠';
  } else if (queueMentions >= 2 && !isPeak) {
    level = 'MAYBE QUEUE (off-peak, might be OK)'; emoji = '🟡';
  } else if (noQueueMentions > queueMentions || reviewCount < 500) {
    level = 'LIKELY NO QUEUE'; emoji = '✅';
  } else {
    level = 'UNKNOWN'; emoji = '❓';
  }

  return { level, emoji, snippets, reservable };
}

async function main() {
  const queries = process.argv.slice(2);
  if (!queries.length) { console.error('Usage: node check_busy.js "place 1" "place 2" ...'); process.exit(1); }

  for (const q of queries) {
    try {
      const result = await searchPlace(q);
      if (!result.places?.length) { console.log(`❌ Not found: ${q}\n`); continue; }

      const p = result.places[0];
      const name = p.displayName?.text || '?';
      const rating = p.rating || '?';
      const reviews = p.userRatingCount || '?';
      const phone = p.nationalPhoneNumber || '—';
      const mapsUrl = p.googleMapsLinks?.placeUri || '';
      const isOpen = p.currentOpeningHours?.openNow;
      const price = p.priceRange ? `¥${p.priceRange.startPrice?.units || '?'}–${p.priceRange.endPrice?.units || '?'}` : '—';

      const openEmoji = isOpen === true ? '🟢' : isOpen === false ? '🔴' : '⚪';
      const openStatus = isOpen === true ? 'OPEN' : isOpen === false ? 'CLOSED' : '?';
      const queue = analyzeQueue(p);

      console.log(`${openEmoji} ${openStatus} — ${name}`);
      console.log(`   ⭐ ${rating} (${reviews} reviews) | 💰 ${price} | 📞 ${phone}`);
      console.log(`   ${queue.emoji} Queue: ${queue.level}`);
      if (queue.snippets.length) console.log(`   💬 "${queue.snippets[0]}"`);
      console.log(`   📍 ${mapsUrl}`);
      console.log();
    } catch (e) {
      console.log(`❌ Error: ${q} — ${e.message}\n`);
    }
  }
}

main();
