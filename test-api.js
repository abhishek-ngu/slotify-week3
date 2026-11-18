#!/usr/bin/env node
/**
 * Simple API test script for Slotify
 * Run with: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let token = '';
let slotId = '';

function makeRequest(path, method, body, useAuth = false) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...(useAuth && token && { 'Authorization': 'Bearer ' + token })
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Slotify API Tests\n');
  
  // Health check
  console.log('1. Health Check');
  let res = await makeRequest('/api/health', 'GET');
  console.log(`   ${res.status === 200 ? '✅' : '❌'} GET /api/health - ${res.status}`);
  
  // Register
  console.log('\n2. User Registration');
  res = await makeRequest('/api/auth/register', 'POST', { 
    name: 'Test User', 
    email: `test${Date.now()}@example.com`, 
    password: 'password123' 
  });
  console.log(`   ${res.status === 201 ? '✅' : '❌'} POST /api/auth/register - ${res.status}`);
  token = res.data.token;
  
  // Login
  console.log('\n3. User Login');
  res = await makeRequest('/api/auth/login', 'POST', { 
    email: 'test11@example.com',  // existing user from earlier tests
    password: 'password123' 
  });
  if (res.status === 401) {
    // Try with the newly registered user
    const email = `test${Date.now()}@example.com`;
    res = await makeRequest('/api/auth/login', 'POST', { email, password: 'password123' });
  }
  console.log(`   ${res.status === 200 ? '✅' : '❌'} POST /api/auth/login - ${res.status}`);
  if (res.data.token) token = res.data.token;
  
  // Get profile
  console.log('\n4. Get Profile (Protected)');
  res = await makeRequest('/api/auth/me', 'GET', null, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} GET /api/auth/me - ${res.status}`);
  
  // Create slot
  console.log('\n5. Create Slot (Protected)');
  res = await makeRequest('/api/slots', 'POST', { 
    title: 'Team Meeting', 
    description: 'Weekly sync',
    startTime: '2024-01-15T10:00:00.000Z',
    endTime: '2024-01-15T11:00:00.000Z'
  }, true);
  console.log(`   ${res.status === 201 ? '✅' : '❌'} POST /api/slots - ${res.status}`);
  slotId = res.data.slot?._id;
  
  // Conflict detection
  console.log('\n6. Conflict Detection (409)');
  res = await makeRequest('/api/slots', 'POST', { 
    title: 'Conflicting Meeting',
    startTime: '2024-01-15T10:30:00.000Z',
    endTime: '2024-01-15T11:30:00.000Z'
  }, true);
  console.log(`   ${res.status === 409 ? '✅' : '❌'} POST /api/slots (conflict) - ${res.status}`);
  
  // Get all slots
  console.log('\n7. Get All Slots');
  res = await makeRequest('/api/slots', 'GET', null, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} GET /api/slots - ${res.status} (count: ${res.data.count})`);
  
  // Get available slots (should be 0 since we booked one)
  console.log('\n8. Get Available Slots (before booking)');
  res = await makeRequest('/api/slots?available=true', 'GET', null, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} GET /api/slots?available=true - ${res.status} (count: ${res.data.count})`);
  
  // Book slot
  console.log('\n9. Book Slot');
  res = await makeRequest(`/api/slots/${slotId}/book`, 'POST', {}, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} POST /api/slots/:id/book - ${res.status}`);
  
  // Double booking (should fail)
  console.log('\n10. Double Booking Prevention (400)');
  res = await makeRequest(`/api/slots/${slotId}/book`, 'POST', {}, true);
  console.log(`   ${res.status === 400 ? '✅' : '❌'} POST /api/slots/:id/book (double) - ${res.status}`);
  
  // Get available slots (should be 0 now)
  console.log('\n11. Get Available Slots (after booking)');
  res = await makeRequest('/api/slots?available=true', 'GET', null, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} GET /api/slots?available=true - ${res.status} (count: ${res.data.count})`);
  
  // Get my bookings
  console.log('\n12. Get My Bookings');
  res = await makeRequest('/api/bookings/me', 'GET', null, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} GET /api/bookings/me - ${res.status} (active: ${res.data.activeCount}, cancelled: ${res.data.cancelledCount})`);
  
  // Cancel booking
  console.log('\n13. Cancel Booking');
  res = await makeRequest(`/api/slots/${slotId}/cancel`, 'POST', {}, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} POST /api/slots/:id/cancel - ${res.status}`);
  
  // Get available slots (should be 1 again)
  console.log('\n14. Get Available Slots (after cancel)');
  res = await makeRequest('/api/slots?available=true', 'GET', null, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} GET /api/slots?available=true - ${res.status} (count: ${res.data.count})`);
  
  // Validation tests
  console.log('\n15. Input Validation Tests');
  res = await makeRequest('/api/slots/invalid-id/book', 'POST', {}, true);
  console.log(`   ${res.status === 400 && res.data.message.includes('format') ? '✅' : '❌'} Invalid slot ID format - ${res.status}`);
  
  res = await makeRequest('/api/slots', 'POST', { startTime: '2024-01-15T10:00:00.000Z', endTime: '2024-01-15T11:00:00.000Z' }, true);
  console.log(`   ${res.status === 400 && res.data.errors?.includes('Title is required') ? '✅' : '❌'} Missing title - ${res.status}`);
  
  res = await makeRequest('/api/slots', 'POST', { title: 'Test', startTime: 'invalid', endTime: '2024-01-15T11:00:00.000Z' }, true);
  console.log(`   ${res.status === 400 && res.data.errors?.includes('ISO 8601') ? '✅' : '❌'} Invalid date format - ${res.status}`);
  
  res = await makeRequest('/api/slots', 'POST', { title: 'Test', startTime: '2024-01-15T11:00:00.000Z', endTime: '2024-01-15T10:00:00.000Z' }, true);
  console.log(`   ${res.status === 400 && res.data.errors?.includes('after') ? '✅' : '❌'} endTime before startTime - ${res.status}`);
  
  // Delete slot
  console.log('\n16. Delete Slot');
  res = await makeRequest('/api/slots', 'POST', { 
    title: 'To Delete', 
    startTime: '2024-01-16T10:00:00.000Z',
    endTime: '2024-01-16T11:00:00.000Z'
  }, true);
  const deleteId = res.data.slot._id;
  res = await makeRequest(`/api/slots/${deleteId}`, 'DELETE', null, true);
  console.log(`   ${res.status === 200 ? '✅' : '❌'} DELETE /api/slots/:id - ${res.status}`);
  
  console.log('\n✨ All tests completed!');
}

runTests().catch(err => {
  console.error('\n❌ Test error:', err.message);
  process.exit(1);
});