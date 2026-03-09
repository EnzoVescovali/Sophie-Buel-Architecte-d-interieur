const form = document.querySelector(".loginForm")
const emailInput = document.getElementById("mail")
const passwordInput = document.getElementById("passW")

async function loginInfo(email, password) {
        const loginRes = await fetch ("http://localhost:5678/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value, })
        })
        
        const login = await loginRes.json()

        console.log(login);

        if (loginRes.ok) {
            console.log("connecté", login);
            localStorage.setItem("token", login.token)
            window.location.href = "index.html";
        } else {
            console.log("Erreur", login);
        }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
    await loginInfo()
    } catch (error) {
    console.log("Something went wrong! Error details:" + error);
    }   
})