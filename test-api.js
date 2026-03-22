async function test() {
  try {
    const response = await fetch("http://localhost:3000/api/lots");
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Data:", data);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
