function togglePassword() {
  const password = document.getElementById("password");
  password.type = password.type === "password" ? "text" : "password";
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "" || password === "") {
    alert("Please enter username and password");
    return;
  }

  // Demo login check
  if (username === "admin" && password === "admin123") {
    alert("Login successful!");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid username or password");
  }
}
