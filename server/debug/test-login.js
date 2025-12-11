import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('🔐 Testing login endpoint...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'yehezkiel@usu.ac.id',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed:', data);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testLogin();