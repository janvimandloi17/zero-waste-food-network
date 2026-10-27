// ============================================
// ZERO WASTE FOOD NETWORK
// Backend Server
// Node.js + Express + MySQL
// ============================================


// ============================================
// 1. IMPORT PACKAGES
// ============================================
require("dotenv").config();
const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");


// ============================================
// 2. CREATE EXPRESS APP
// ============================================

const app = express();

console.log("RUNNING THE CORRECT SERVER.JS FILE");

app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
});

app.get("/test-route", (req, res) => {
    res.send("Correct server.js is running!");
});

const PORT = 3000;


// ============================================
// 3. MIDDLEWARE
// ============================================

// Allow frontend pages to communicate with server
app.use(cors());

// Allow JSON data from frontend
app.use(express.json());

// Allow form data
app.use(express.urlencoded({ extended: true }));


// ============================================
// 4. MYSQL DATABASE CONNECTION
// ============================================

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "zero_waste_food_network",
    port: process.env.DB_PORT || 3306
});


// ============================================
// 5. CONNECT TO MYSQL
// ============================================

db.connect((err) => {

    if (err) {

        console.error("❌ MySQL connection failed:");
        console.error(err.message);

        return;
    }

    console.log("✅ MySQL connected successfully!");

});


// ============================================
// 6. SERVE FRONTEND
// ============================================

/* HOMEPAGE */
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "main.html"));
});

/* SERVE STATIC FILES */
app.use(express.static(__dirname));


// ============================================
// USER REGISTRATION API
// POST /register
// ============================================

app.post("/register", async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check required fields
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields."
            });
        }

        // Validate role
        if (!["donor", "receiver"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be donor or receiver."
            });
        }

        // Basic validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Hash password before storing it
        const passwordHash = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (username, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [username.trim(), email.trim().toLowerCase(), passwordHash, role],
            (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            success: false,
                            message: "Username or email already exists."
                        });
                    }

                    console.error("Registration error:", err.message);

                    return res.status(500).json({
                        success: false,
                        message: "Could not register user."
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: "Registration successful!",
                    user_id: result.insertId
                });
            }
        );
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred."
        });
    }
});

// ============================================
// USER LOGIN API
// POST /login
// ============================================

app.post("/login", (req, res) => {
    const { username, password, role } = req.body;

    // Check required fields
    if (!username || !password || !role) {
        return res.status(400).json({
            success: false,
            message: "Please enter username, password, and account type."
        });
    }

    // Validate role
    if (!["donor", "receiver"].includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Invalid account type."
        });
    }

    // Find user by username and role
    const sql = `
        SELECT id, username, email, password_hash, role
        FROM users
        WHERE username = ? AND role = ?
        LIMIT 1
    `;

    db.query(sql, [username.trim(), role], async (err, results) => {
        if (err) {
            console.error("Login database error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Database error during login."
            });
        }

        // User not found
        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const user = results[0];

        try {
            // Compare entered password with stored hash
            const passwordMatches = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password."
                });
            }

            // Login successful
            return res.status(200).json({
                success: true,
                message: "Login successful!",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error("Password verification error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Could not verify password."
            });
        }
    });
});





// ============================================
// 7. DONOR SIDE
// POST /listings
//
// Used when donor publishes surplus food
// ============================================

app.post("/listings", (req, res) => {

    // Get data sent from surplus.html
    const {
        donor_id,
        quantity,
        food_type,
        prepared_at,
        pickup_address,
        pickup_window,
        safe_until

    } = req.body;
    
// Check whether donor ID was provided
if (!donor_id) {
    return res.status(400).json({
        success: false,
        message: "Donor ID is missing. Please log in again."
    });
}




    // Check required fields
    if (
        !quantity ||
        !food_type ||
        !prepared_at ||
        !pickup_address ||
        !pickup_window ||
        !safe_until
    ) {

        return res.status(400).json({

            success: false,

            message: "Please fill in all required fields."

        });

    }


    // SQL query
    const sql = `

        INSERT INTO food_listings

        (
            donor_id,
            quantity,
            food_type,
            prepared_at,
            pickup_address,
            pickup_window,
            safe_until
        )

        VALUES (?, ?, ?, ?, ?, ?,?)

    `;


    // Values for SQL query
    const values = [
        donor_id,
        quantity,
        food_type,
        prepared_at,
        pickup_address,
        pickup_window,
        safe_until

    ];


    // Execute query
    db.query(sql, values, (err, result) => {

        if (err) {

            console.error(
                "❌ Error inserting food listing:",
                err.message
            );

            return res.status(500).json({

                success: false,

                message: "Database error while adding food listing."

            });

        }


        // Successful response
        res.status(201).json({

            success: true,

            message: "Food listing added successfully! 🌱",

            listing_id: result.insertId

        });

    });

});


// ============================================
// 8. RECEIVER SIDE
// GET /listings
//
// Used by receiver.html to get food listings
// ============================================


app.get("/listings", (req, res) => {

    const sql = `
        SELECT
            food_listings.*,
            users.username AS donor_name
        FROM food_listings
        LEFT JOIN users
            ON food_listings.donor_id = users.id
        ORDER BY food_listings.created_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(
                "❌ Error fetching listings:",
                err.message
            );

            return res.status(500).json({
                success: false,
                message: "Database error while fetching listings."
            });
        }

        res.json({
            success: true,
            listings: results
        });

    });

});




app.get("/test-delete-route", (req, res) => {
    console.log("TEST DELETE ROUTE WAS CALLED");
    res.send("DELETE route section is reachable!");
});
// DELETE a food listing
app.delete("/listings/:id", (req, res) => {
    const listingId = req.params.id;
    const donorId = req.body.donor_id;

    // Validate donor ID
    if (!donorId) {
        return res.status(400).json({
            success: false,
            message: "Donor ID is required."
        });
    }

    // Check whether the listing has an approved request
    const checkSql = `
        SELECT id
        FROM food_requests
        WHERE listing_id = ? AND status = 'Approved'
        LIMIT 1
    `;

    db.query(checkSql, [listingId], (checkErr, requests) => {
        if (checkErr) {
            console.error("Error checking food requests:", checkErr.message);

            return res.status(500).json({
                success: false,
                message: "Could not verify food requests."
            });
        }

        // Prevent deletion if an approved request exists
        if (requests.length > 0) {
            return res.status(400).json({
                success: false,
                message: "This listing has an approved food request and cannot be deleted."
            });
        }

        // Delete only the donor's own listing
        const sql = `
            DELETE FROM food_listings
            WHERE id = ? AND donor_id = ?
        `;

        db.query(sql, [listingId, donorId], (err, result) => {
            if (err) {
                console.error("Error deleting listing:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Failed to delete food listing."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Listing not found or you do not own this listing."
                });
            }

            return res.json({
                success: true,
                message: "Food listing deleted successfully."
            });
        });
    });
});
// ============================================
// 9. FOOD REQUEST API
// POST /requests
// ============================================
app.get("/check-requests-route", (req, res) => {
    res.send("Food requests route check passed!");
});

app.post("/requests", (req, res) => {
    const { listing_id, receiver_id } = req.body;

    // Validate required fields
    if (!listing_id || !receiver_id) {
        return res.status(400).json({
            success: false,
            message: "Listing ID and receiver ID are required."
        });
    }

    // Check whether the food listing exists and has not expired
    const checkSql = `
        SELECT id, safe_until
        FROM food_listings
        WHERE id = ?
    `;

    db.query(checkSql, [listing_id], (checkErr, listings) => {
        if (checkErr) {
            console.error("Listing check error:", checkErr.message);

            return res.status(500).json({
                success: false,
                message: "Could not verify the food listing."
            });
        }

        // Check whether the listing exists
        if (listings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Food listing not found."
            });
        }

        // Check whether the food has expired
        const safeUntil = listings[0].safe_until;

        if (!safeUntil || new Date(safeUntil).getTime() <= Date.now()) {
            return res.status(400).json({
                success: false,
                message: "This food listing has expired and cannot be requested."
            });
        }

        // Save the food request if the listing has not expired
        const sql = `
            INSERT INTO food_requests (listing_id, receiver_id)
            VALUES (?, ?)
        `;

        db.query(sql, [listing_id, receiver_id], (err, result) => {
            if (err) {
                // Prevent duplicate requests
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "You have already requested this food."
                    });
                }

                // Handle invalid listing or receiver IDs
                if (err.code === "ER_NO_REFERENCED_ROW_2") {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid listing or receiver ID."
                    });
                }

                console.error("Food request error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Could not submit the food request."
                });
            }

            return res.status(201).json({
                success: true,
                message: "Food request submitted successfully!",
                request_id: result.insertId
            });
        });
    });
});
// ==========================================
// GET FOOD REQUESTS FOR A DONOR
// ==========================================

app.get("/donor-requests/:donorId", (req, res) => {
    const donorId = req.params.donorId;

    const sql = `
        SELECT
            fr.id AS request_id,
            fr.listing_id,
            fr.receiver_id,
            fr.status,
            fr.requested_at,
            u.username AS receiver_name,
            fl.food_type,
            fl.quantity,
            fl.pickup_address
        FROM food_requests fr
        JOIN food_listings fl
            ON fr.listing_id = fl.id
        JOIN users u
            ON fr.receiver_id = u.id
        WHERE fl.donor_id = ?
        ORDER BY fr.requested_at DESC
    `;

    db.query(sql, [donorId], (err, results) => {
        if (err) {
            console.error("Error fetching donor requests:", err.message);

            return res.status(500).json({
                success: false,
                message: "Could not fetch food requests."
            });
        }

        res.json({
            success: true,
            requests: results
        });
    });
});

// UPDATE FOOD REQUEST STATUS
app.put("/food-requests/:requestId", (req, res) => {
    const requestId = req.params.requestId;
    const { status, donor_id } = req.body;

    // Validate status
    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be Approved or Rejected."
        });
    }

    if (!donor_id) {
        return res.status(400).json({
            success: false,
            message: "Donor ID is required."
        });
    }

    // Update only a request belonging to this donor
    const sql = `
        UPDATE food_requests fr
        JOIN food_listings fl ON fr.listing_id = fl.id
        SET fr.status = ?
        WHERE fr.id = ?
          AND fl.donor_id = ?
          AND fr.status = 'Pending'
    `;

    db.query(sql, [status, requestId, donor_id], (err, result) => {
        if (err) {
            console.error("Error updating request status:", err.message);
            return res.status(500).json({
                success: false,
                message: "Could not update food request."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Request not found, not owned by this donor, or already processed."
            });
        }

        res.json({
            success: true,
            message: `Food request ${status.toLowerCase()} successfully.`
        });
    });
});


// GET FOOD REQUESTS FOR A RECEIVER
app.get("/receiver-requests/:receiverId", (req, res) => {
    const receiverId = req.params.receiverId;

    const sql = `
        SELECT
            fr.id AS request_id,
            fr.listing_id,
            fr.status,
            fr.requested_at,
            fl.food_type,
            fl.quantity,
            fl.pickup_address
        FROM food_requests fr
        JOIN food_listings fl
            ON fr.listing_id = fl.id
        WHERE fr.receiver_id = ?
        ORDER BY fr.requested_at DESC
    `;

    db.query(sql, [receiverId], (err, results) => {
        if (err) {
            console.error("Error fetching receiver requests:", err.message);

            return res.status(500).json({
                success: false,
                message: "Could not fetch your food requests."
            });
        }

        res.json({
            success: true,
            requests: results
        });
    });
});
// Cancel a pending food request
app.delete("/receiver-requests/:requestId", (req, res) => {
    const requestId = req.params.requestId;
    const { receiver_id } = req.body;

    // Validate receiver ID
    if (!receiver_id) {
        return res.status(400).json({
            success: false,
            message: "Receiver ID is required."
        });
    }

    // Delete only a pending request belonging to this receiver
    const sql = `
        DELETE FROM food_requests
        WHERE id = ?
          AND receiver_id = ?
          AND status = 'Pending'
    `;

    db.query(sql, [requestId, receiver_id], (err, result) => {
        if (err) {
            console.error("Error cancelling food request:", err.message);

            return res.status(500).json({
                success: false,
                message: "Could not cancel the food request."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "Request not found, or it is no longer pending."
            });
        }

        return res.json({
            success: true,
            message: "Food request cancelled successfully."
        });
    });
});

// ============================================
// 9. START SERVER
// ============================================

app.listen(PORT, () => {

    console.log("");
    console.log("========================================");
    console.log("🌱 ZERO WASTE FOOD NETWORK");
    console.log("========================================");
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
    console.log(`🍲 Food API: http://localhost:${PORT}/listings`);
    console.log("========================================");
    console.log("");

});
