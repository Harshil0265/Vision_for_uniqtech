// Quick test to check if backend is responding
async function testBackend() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    console.log('✅ Backend is running:', data);
  } catch (error) {
    console.error('❌ Backend is NOT running:', error.message);
    console.log('\n💡 Solution: Make sure you run "npm run dev" which starts both frontend and backend');
  }
}

testBackend();
