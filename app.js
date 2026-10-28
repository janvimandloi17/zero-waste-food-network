/* =========================================
   PASSWORD VISIBILITY
========================================= */

function togglePassword(inputId, button) {

    const input = document.getElementById(inputId);
    const icon = button.querySelector("i");

    if (input.type === "password") {

        input.type = "text";

        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");

        button.setAttribute("aria-label", "Hide password");

    } else {

        input.type = "password";

        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");

        button.setAttribute("aria-label", "Show password");
    }
}



/* =========================================
   FORGOT PASSWORD MODAL
========================================= */

const forgotModal = document.getElementById("forgotModal");

function openForgotPassword(accountType) {
    if (!forgotModal) return;

    forgotModal.classList.add("active");
    document.body.style.overflow = "hidden";

    console.log("Password reset requested for:", accountType);
}

function closeForgotPassword() {
    if (!forgotModal) return;

    forgotModal.classList.remove("active");
    document.body.style.overflow = "auto";
}

if (forgotModal) {
    forgotModal.addEventListener("click", function(event) {
        if (event.target === forgotModal) {
            closeForgotPassword();
        }
    });
}

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeForgotPassword();
    }
});

/* =========================================
   DATABASE LOGIN
========================================= */

function handleLogin(formId, usernameId, passwordId, role, messageId) {
    const form = document.getElementById(formId);
    const message = document.getElementById(messageId);

    // This page might not contain the login form.
    if (!form || !message) {
        return;
    }

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const username = document.getElementById(usernameId).value.trim();
        const password = document.getElementById(passwordId).value;

        message.textContent = "Checking login details...";

        try {
           const response = await fetch("http://localhost:3000/login", {

                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: role
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                message.textContent = result.message || "Login failed.";
                return;
            }

            // Store the logged-in user's information.
            sessionStorage.setItem("user", JSON.stringify(result.user));

            message.textContent = "Login successful! Redirecting...";

            // Redirect according to the user's role.
            if (result.user.role === "donor") {
                window.location.href = "surplus.html";
            } else if (result.user.role === "receiver") {
                window.location.href = "receiver.html";
            } else {
                message.textContent = "Invalid account role.";
            }

        } catch (error) {
            console.error("Login error:", error);

            message.textContent =
                "Cannot connect to the server. Check whether the backend is running.";
        }
    });
}

handleLogin(
    "donorForm",
    "donorUsername",
    "donorPassword",
    "donor",
    "donorMessage"
);

handleLogin(
    "ngoForm",
    "ngoUsername",
    "ngoPassword",
    "receiver",
    "ngoMessage"
);
/* =========================================
   CHECK USER LOGIN
========================================= */

function checkLogin(requiredRole) {
    const storedUser = sessionStorage.getItem("user");

    if (!storedUser) {
        alert("Please log in first.");
        window.location.href = "index.html";
        return false;
    }

    try {
        const user = JSON.parse(storedUser);

        if (user.role !== requiredRole) {
            alert("You are not authorized to access this page.");
            window.location.href = "index.html";
            return false;
        }

        return true;

    } catch (error) {
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
        return false;
    }
}