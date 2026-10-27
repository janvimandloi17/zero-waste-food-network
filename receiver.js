// ==========================================
// ZERO WASTE FOOD NETWORK
// RECEIVER PAGE JAVASCRIPT
// ==========================================

// Backend API
const API_URL = "http://localhost:3000/listings";


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const listingsContainer =
    document.getElementById("listingsContainer");

const statusText =
    document.getElementById("statusText");

const refreshButton =
    document.getElementById("refreshButton");

// Search and filter elements
const searchFood = document.getElementById("searchFood");
const filterFoodType = document.getElementById("filterFoodType");

// Store all food listings fetched from the server
let allListings = [];


// Notification popup
const notificationOverlay =
    document.getElementById("notificationOverlay");

const popupClose =
    document.getElementById("popupClose");

const popupTitle =
    document.getElementById("popupTitle");

const popupMessage =
    document.getElementById("popupMessage");

const viewListingsButton =
    document.getElementById("viewListingsButton");


// Request popup
const requestOverlay =
    document.getElementById("requestOverlay");

const requestClose =
    document.getElementById("requestClose");

const requestDone =
    document.getElementById("requestDone");


// ==========================================
// VARIABLES
// ==========================================

let knownListingIds = [];

let firstLoad = true;


// ==========================================
// FETCH FOOD LISTINGS
// ==========================================

async function fetchListings() {

    try {

        // Ask server for food listings
        const response = await fetch(API_URL);

        // Check server response
        if (!response.ok) {
            throw new Error("Server returned an error");
        }

        // Convert response to JSON
        const data = await response.json();

        // Check API response
        if (!data.success) {
            throw new Error(data.message);
        }

        // Get listings
        const listings = data.listings || [];

        allListings = listings;


        // Update number/status
        updateStatus(listings);


        // Display food cards using the current search and filter
        filterListings();

        // Check whether new food has been added
        checkForNewListings(listings);


    } catch (error) {

        console.error(
            "Error fetching listings:",
            error
        );

        statusText.textContent =
            "Server unavailable";


        listingsContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load listings
                </h3>

                <p>
                    Make sure your Node.js server
                    and MySQL are running.
                </p>

            </div>
        `;
    }
}


// ==========================================
// DISPLAY FOOD LISTINGS
// ==========================================

function displayListings(listings) {

    // No food available
    if (listings.length === 0) {

        listingsContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🍃
                </div>

                <h3>
                    No food available right now
                </h3>

                <p>
                    New surplus food listings will
                    appear here when donors publish them.
                </p>

            </div>
        `;

        return;
    }


    // Create cards
    listingsContainer.innerHTML =
        listings.map(listing => {

            return createFoodCard(listing);

        }).join("");
}


// ==========================================
// CREATE FOOD CARD
// ==========================================

function createFoodCard(listing) {

    const donorName =
        listing.donor_name ||
        "Donor information unavailable";


    const createdDate =
        formatDate(listing.created_at);


    return `
        <article class="food-card">

            <!-- Card Top -->
            <div class="card-top">

                <div>

                    <span class="food-type">
                        ${escapeHTML(
        listing.food_type || "Food"
    )}
                    </span>

                    <h3>
                        Surplus Food
                    </h3>

                </div>


                <span class="listing-date">
                    ${createdDate}
                </span>

            </div>


            <!-- Food Details -->
            <div class="details">


                <!-- Quantity -->
                <div class="detail">

                    <span class="detail-label">
                        Quantity
                    </span>

                    <span class="detail-value">
                        ${escapeHTML(
        listing.quantity ||
        "Not specified"
    )}
                    </span>

                </div>


                <!-- Prepared At -->
                <div class="detail">

                    <span class="detail-label">
                        Prepared At
                    </span>

                    <span class="detail-value">
                     ${formatDate(listing.prepared_at)}   
                    </span>

                </div>


                <!-- Pickup Address -->
                <div class="detail">

                    <span class="detail-label">
                        Pickup Address
                    </span>

                    <span class="detail-value">
                        ${escapeHTML(
        listing.pickup_address ||
        "Not specified"
    )}
                    </span>

                </div>


                <!-- Pickup Window -->
                <div class="detail">

                    <span class="detail-label">
                        Pickup Window
                    </span>

                    <span class="detail-value">
                        ${escapeHTML(
        listing.pickup_window ||
        "Not specified"
    )}
                    </span>

                </div>


                <!-- Safe Until -->
                <div class="detail">

                    <span class="detail-label">
                        Safe Until
                    </span>

                    <span class="detail-value safe-value">
                       ${formatDate(listing.safe_until)}
                    </span>

                </div>

            </div>


            <!-- Donor -->
            <div class="donor-section">

                <p class="donor-title">
                    Donor
                </p>

                <p class="donor-name">
                    ${escapeHTML(donorName)}
                </p>

            </div>


            <!-- Request Button -->
            <button
                class="request-button"
                onclick="requestFood(${listing.id})">

                Request Food →

            </button>

        </article>
    `;
}


// ==========================================
// UPDATE AVAILABILITY STATUS
// ==========================================

function updateStatus(listings) {

    if (listings.length > 0) {

        statusText.textContent =
            `${listings.length} food listing${listings.length > 1 ? "s" : ""
            } available`;

    } else {

        statusText.textContent =
            "No food available right now";
    }
}


// ==========================================
// CHECK FOR NEW LISTINGS
// ==========================================

function checkForNewListings(listings) {

    // Get IDs from current listings
    const currentIds =
        listings.map(listing => listing.id);


    // FIRST TIME PAGE LOAD
    if (firstLoad) {

        knownListingIds =
            currentIds;

        firstLoad = false;


        // If food already exists,
        // show Food Available popup
        if (listings.length > 0) {

            showFoodAvailablePopup();
        }

        return;
    }


    // Find newly added food
    const newListings =
        listings.filter(listing =>

            !knownListingIds.includes(
                listing.id
            )

        );


    // If new food exists
    if (newListings.length > 0) {

        showNewListingPopup();
    }


    // Update known IDs
    knownListingIds =
        currentIds;
}


// ==========================================
// FOOD AVAILABLE POPUP
// ==========================================

function showFoodAvailablePopup() {

    popupTitle.textContent =
        "Food Available!";

    popupMessage.textContent =
        "Fresh surplus food has been added to the network.";

    viewListingsButton.textContent =
        "View Listings";

    notificationOverlay.classList.add("show");
}


// ==========================================
// NEW FOOD POPUP
// ==========================================

function showNewListingPopup() {

    popupTitle.textContent =
        "New Food Available!";

    popupMessage.textContent =
        "A new surplus food listing has been published.";

    viewListingsButton.textContent =
        "View Listing";

    notificationOverlay.classList.add("show");
}


// ==========================================
// CLOSE FOOD POPUP
// ==========================================

popupClose.addEventListener(
    "click",
    () => {

        notificationOverlay.classList.remove(
            "show"
        );

    }
);


// ==========================================
// VIEW LISTINGS BUTTON
// ==========================================

viewListingsButton.addEventListener(
    "click",
    () => {

        notificationOverlay.classList.remove(
            "show"
        );


        document
            .querySelector(".listings-section")
            .scrollIntoView({
                behavior: "smooth"
            });

    }
);



// ==========================================
// REQUEST FOOD
// ==========================================

async function requestFood(listingId) {

    // Get logged-in receiver
    const storedUser = sessionStorage.getItem("user");

    if (!storedUser) {
        alert("Please log in before requesting food.");
        window.location.href = "index.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(storedUser);
    } catch (error) {
        sessionStorage.removeItem("user");
        alert("Your login session is invalid. Please log in again.");
        window.location.href = "index.html";
        return;
    }

    if (user.role !== "receiver") {
        alert("Only receivers can request food.");
        return;
    }

    try {
        console.log("Sending food request for listing:", listingId);
        const response = await fetch("http://localhost:3000/requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                listing_id: listingId,
                receiver_id: user.id
            })
        });

        const result = await response.json();
        console.log("Server response status:", response.status);
        console.log("Server response data:", result);

        if (!response.ok || !result.success) {
            alert(result.message || "Unable to submit your food request.");
            return;
        }

        // Show confirmation only after successful database insertion
        requestOverlay.classList.add("show");

    } catch (error) {
        console.error("Food request error:", error);

        alert(
            "Cannot connect to the server. Make sure Node.js is running."
        );
    }
}



// ==========================================
// DONE BUTTON
// ==========================================

requestDone.addEventListener(
    "click",
    () => {

        requestOverlay.classList.remove(
            "show"
        );

    }
);


// ==========================================
// REFRESH BUTTON
// ==========================================

refreshButton.addEventListener(
    "click",
    () => {

        fetchListings();

    }
);


// ==========================================
// AUTO CHECK EVERY 5 SECONDS
// ==========================================

setInterval(
    () => {

        fetchListings();

    },
    5000
);


// ==========================================
// FORMAT DATE
// ==========================================


function formatDate(dateString) {
    if (!dateString) {
        return "Not specified";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return escapeHTML(dateString);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
    });
}




// ==========================================
// SECURITY FUNCTION
// Prevent HTML injection
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}


// ==========================================
// START
// ==========================================

fetchListings();


// LOAD FOOD REQUESTS FOR THE LOGGED-IN RECEIVER
async function loadMyRequests() {
    const container = document.getElementById("myRequestsContainer");
    const storedUser = sessionStorage.getItem("user");

    if (!container || !storedUser) return;

    try {
        const user = JSON.parse(storedUser);

        const response = await fetch(
            `http://localhost:3000/receiver-requests/${user.id}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Could not load your requests.");
        }

        container.innerHTML = "";

        if (result.requests.length === 0) {
            container.innerHTML = "<p>You have not requested any food yet.</p>";
            return;
        }

        result.requests.forEach(request => {
            const card = document.createElement("div");
            card.className = "my-request-card";

            const heading = document.createElement("h3");
            heading.textContent = request.food_type;

            const quantity = document.createElement("p");
            quantity.textContent = "Quantity: " + request.quantity;

            const address = document.createElement("p");
            address.textContent = "Pickup Address: " + request.pickup_address;

            // Show when the request was submitted
            const requestedAt = document.createElement("p");

            if (request.requested_at) {
                const date = new Date(request.requested_at);

                requestedAt.textContent = "Requested On: " +
                    (isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    }));
            } else {
                requestedAt.textContent = "Requested On: Not available";
            }

            const status = document.createElement("p");
            status.textContent = "Status: " + request.status;
            status.className = "request-status " + request.status.toLowerCase();

            card.append(heading, quantity, address, requestedAt, status);

            // Show Cancel button only for pending requests
            if (request.status === "Pending") {
                const cancelButton = document.createElement("button");
                cancelButton.textContent = "Cancel Request";
                cancelButton.className = "cancel-request-btn";

                cancelButton.addEventListener("click", async () => {
                    const confirmed = confirm(
                        "Are you sure you want to cancel this food request?"
                    );

                    if (!confirmed) return;

                    try {
                        const storedUser = sessionStorage.getItem("user");
                        const user = JSON.parse(storedUser);

                        const response = await fetch(
                            `http://localhost:3000/receiver-requests/${request.request_id}`,
                            {
                                method: "DELETE",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    receiver_id: user.id
                                })
                            }
                        );

                        const result = await response.json();

                        if (!response.ok || !result.success) {
                            throw new Error(
                                result.message || "Could not cancel the request."
                            );
                        }

                        alert(result.message);

                        // Reload requests to show the latest status
                        loadMyRequests();

                    } catch (error) {
                        console.error("Cancel request error:", error);
                        alert(error.message || "Could not cancel the request.");
                    }
                });

                card.appendChild(cancelButton);
            }

            container.appendChild(card);
            
        });

    } catch (error) {
        console.error("Error loading your requests:", error);
        container.innerHTML =
            "<p>Could not load your requests. Please try again.</p>";
    }
}

// Load requests when the receiver page opens
loadMyRequests();

// Automatically update request statuses every 5 seconds
setInterval(() => {
    loadMyRequests();
}, 5000);
// ==========================================
// SEARCH AND FILTER FOOD LISTINGS
// ==========================================

function filterListings() {
    const searchText = searchFood.value.trim().toLowerCase();
    const selectedType = filterFoodType.value;

    // Get the current time
    const currentTime = new Date();

    // Filter listings by expiry, search text, and food type
    const filteredListings = allListings.filter(listing => {
        const foodType = (listing.food_type || "").toLowerCase();

        // Hide expired food listings
        if (listing.safe_until) {
            const safeUntil = new Date(listing.safe_until);

            if (!isNaN(safeUntil.getTime()) && safeUntil < currentTime) {
                return false;
            }
        }

        const matchesSearch =
            foodType.includes(searchText) ||
            (listing.pickup_address || "").toLowerCase().includes(searchText);

        let matchesType = true;

        if (selectedType === "vegetarian") {
            matchesType =
                foodType.includes("vegetarian") &&
                !foodType.includes("non-vegetarian");
        } else if (selectedType === "non-vegetarian") {
            matchesType = foodType.includes("non-vegetarian");
        }

        return matchesSearch && matchesType;
    });

    // Display only matching listings
    displayListings(filteredListings);
}

// Search as the user types
searchFood.addEventListener("input", filterListings);

// Filter when the dropdown changes
filterFoodType.addEventListener("change", filterListings);