const lr = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email:'admin@webxter.com', password:'Admin@1234'})
});
const token = (await lr.json()).access;

// Check what status choices exist
const r1 = await fetch('http://127.0.0.1:8000/api/v1/admin/orders/', {
  method: 'OPTIONS',
  headers: {Authorization: `Bearer ${token}`}
});
const d1 = await r1.json();
console.log('List Allow:', r1.headers.get('Allow'));
console.log('Status choices:', JSON.stringify(d1.actions?.POST?.status?.choices));

// Try updating status via a custom action endpoint
const endpoints = [
  '/api/v1/admin/orders/1/update_status/',
  '/api/v1/admin/orders/1/status/',
  '/api/v1/admin/orders/1/change_status/',
];
for (const ep of endpoints) {
  const r = await fetch('http://127.0.0.1:8000' + ep, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify({status: 'confirmed'})
  });
  console.log(ep, '->', r.status);
}

// Try PUT on detail
const rp = await fetch('http://127.0.0.1:8000/api/v1/admin/orders/1/', {
  method: 'PUT',
  headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
  body: JSON.stringify({status: 'confirmed'})
});
console.log('PUT /admin/orders/1/ ->', rp.status, (await rp.text()).slice(0, 150));
