/* =========================================
CHECK USER LOGIN AND ROLE
========================================= */

function checkLogin(requiredRole) {
const storedUser = sessionStorage.getItem("user");


// Check whether the user is logged in
if (!storedUser) {
    alert("Please log in first.");
    window.location.href = "index.html";
    return false;
}

try {
    const user = JSON.parse(storedUser);

    // Check whether the user has the correct role
    if (user.role !== requiredRole) {
        alert("You are not authorized to access this page.");
        window.location.href = "index.html";
        return false;
    }

    return true;

} catch (error) {
    sessionStorage.removeItem("user");
    alert("Invalid login session. Please log in again.");
    window.location.href = "index.html";
    return false;
}


}

/* =========================================
LOGOUT
========================================= */

function logout() {
sessionStorage.removeItem("user");
window.location.href = "index.html";
}
