// Check live status of places using Google Places API (New)
// Usage: node check_busy.js "restaurant 1" "restaurant 2" ...
// Requires: GOOGLE_MAPS_API_KEY env var (or .env file in repo root)
//
// Example:
//   source .env && node check_busy.js "金子半之助 日本橋" "つじ半 日本橋" "竹葉亭 銀座"

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error('Set GOOGLE_MAPS_API_KEY in .env or environment');
  process.exit(1);
}

function searchPlace(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      textQuery: query,
      languageCode: 'en',
      locationBias: {
        circle: {
          center: { latitude: 35.6461, longitude: 139.7106 }, // Ebisu home
          radius: 15000
        }
      }
    });

    const options = {
      hostname: 'places.googleapis.com',
      path: '/v1/places:searchText',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
          'places.displayName',
          'places.rating',
          'places.userRatingCount',
          'places.currentOpeningHours',
          'places.nationalPhoneNumber',
          'places.googleMapsUri',
          'places.businessStatus',
        ].join(','),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const queries = process.argv.slice(2);

  if (queries.length === 0) {
    console.error('Usage: node check_busy.js "place 1" "place 2" ...');
    process.exit(1);
  }

  for (const q of queries) {
    try {
      const result = await searchPlace(q);
      if (result.places && result.places.length > 0) {
        const p = result.places[0];
        const name = p.displayName?.text || '?';
        const rating = p.rating || '?';
        const reviews = p.userRatingCount || '?';
        const phone = p.nationalPhoneNumber || '—';
        const mapsUrl = p.googleMapsUri || '';
        const isOpen = p.currentOpeningHours?.openNow;

        const emoji = isOpen === true ? '🟢' : isOpen === false ? '🔴' : '⚪';
        const status = isOpen === true ? 'OPEN' : isOpen === false ? 'CLOSED' : 'UNKNOWN';

        console.log(`${emoji} ${status} — ${name}`);
        console.log(`   ⭐ ${rating} (${reviews} reviews) | 📞 ${phone}`);
        console.log(`   📍 ${mapsUrl}`);
        console.log();
      } else {
        console.log(`❌ Not found: ${q}\n`);
      }
    } catch (e) {
      console.log(`❌ Error: ${q} — ${e.message}\n`);
    }
  }
}

main();
