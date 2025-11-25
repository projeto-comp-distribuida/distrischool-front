// Simple script to create an ADMIN user via backend API
// Usage examples:
//   node scripts/create-admin.js --api http://localhost:8080 --email admin@example.com --password Passw0rd! --first "Admin" --last "User"
// Or using env vars:
//   API_URL=http://localhost:8080 ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=Passw0rd! node scripts/create-admin.js

const args = require('minimist')(process.argv.slice(2));

// sanitize helpers: if user accidentally concatenates additional shell text, take the first token
const firstToken = (s) => (typeof s === 'string' ? s.trim().split(/\s+/)[0] : s);
const apiUrlRaw = args.api || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://distrischool.ddns.net';
const apiUrl = firstToken(apiUrlRaw);
const email = args.email || process.env.ADMIN_EMAIL;
const password = args.password || process.env.ADMIN_PASSWORD;
const firstName = args.first || process.env.ADMIN_FIRSTNAME || 'Admin';
const lastName = args.last || process.env.ADMIN_LASTNAME || 'User';

if (!email || !password) {
  console.error('Missing required fields. Provide --email and --password or set ADMIN_EMAIL and ADMIN_PASSWORD env vars.');
  process.exit(1);
}

const payload = {
  email,
  password,
  confirmPassword: password,
  firstName,
  lastName,
  roles: ['ADMIN']
};

(async () => {
  try {
    // Node 18+ has global fetch. If not available, instruct to use node >=18 or install node-fetch.
    if (typeof fetch === 'undefined') {
      console.error('Global fetch is not available in this Node runtime. Use Node 18+ or install node-fetch.');
      process.exit(2);
    }

    // validate apiUrl looks like a URL
    try {
      // new URL will throw if invalid
      // allow relative URLs by prepending http:// if necessary
      new URL(apiUrl.includes('://') ? apiUrl : `http://${apiUrl}`);
    } catch (e) {
      console.error('Invalid API URL:', apiUrlRaw);
      console.error('Make sure you set --api or API_URL without additional shell text. Example:');
      console.error("node scripts/create-admin.js --api http://distrischool.ddns.net --email admin@example.com --password 'Passw0rd!'");
      process.exit(2);
    }

    const url = `${apiUrl.replace(/\/+$/,'')}/api/v1/auth/register`;
    console.log(`Sending request to ${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch(e) { json = text; }

    if (!res.ok) {
      console.error(`Request failed (${res.status} ${res.statusText}):`, json);
      process.exit(3);
    }

    console.log('User created successfully:', json);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(4);
  }
})();
