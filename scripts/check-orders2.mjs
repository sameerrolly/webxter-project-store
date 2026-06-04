const lr = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email:'admin@webxter.com', password:'Admin@1234'})
});
const token = (await lr.json()).access;

// Check detail endpoint allowed methods
const r1 = await fetch('http://127.0.0.1:8000/api/v1/admin/orders/1/', {
  method: 'OPTIONS',
  headers: {Authorization: `Bearer ${token}`}
});
console.log('Detail Allow:', r1.headers.get('Allow'));

// Try /api/v1/admin/orders/1/status/ with PATCH
const r2 = await fetch('http://127.0.0.1:8000/api/v1/admin/orders/1/status/', {
  method: 'PATCH',
  headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
  body: JSON.stringify({status: 'confirmed'})
});
console.log('PATCH /status/ ->', r2.status, (await r2.text()).slice(0, 200));

// Check what the /status/ endpoint allows
const r3 = await fetch('http://127.0.0.1:8000/api/v1/admin/orders/1/status/', {
  method: 'OPTIONS',
  headers: {Authorization: `Bearer ${token}`}
});
console.log('/status/ Allow:', r3.headers.get('Allow'));
const d3 = await r3.json();
console.log('/status/ actions:', JSON.stringify(d3.actions));
