// Test API calls untuk debug upload flow
// curl http://localhost:5000/api/materials/24/1

import axios from "axios";

const API_BASE = "http://localhost:5000/api";

async function testGetMaterials() {
  try {
    console.log("Testing GET /materials/24/1...");
    const response = await axios.get(`${API_BASE}/materials/24/1`, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTczMzkyODcyMH0.sQhjjVNKVZGv9tFfE_3X3xyLHSAR1lh7iHqKkSxhxBc`, // Dummy token, replace if needed
      },
    });

    console.log("Response status:", response.status);
    console.log("Materials found:", response.data.materials?.length);
    console.log("Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testGetMaterials();
