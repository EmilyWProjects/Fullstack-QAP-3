//Requirements and setup
const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


//Registered users array
const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "regular", // Regular user
    },
];


// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    //Load pages
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});


// GET /login - Render login form
app.get("/login", (request, response) => {
    //Load page
    response.render("login");
});


// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    //Validate form input
    const { email, password } = request.body;
    if (!email || !password) {
      return response.render("login", { error: "Email or password cannot be blank!" });
    }
    //Check if user exists
    const user = USERS.find((user) => user.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return response.render("login", { error: "Password or email is invalid!" });
    }
    //Stores session 
    request.session.user = user;
    response.redirect("/landing");
});


// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    if (!request.session.user) {
        return response.redirect("/login");
    }
    //Render based on role
    const { user } = request.session;  // Directly pass the entire 'user' object

    if (user.role === "admin") {
        response.render("landing", { user, USERS });
    } else {
        response.render("landing", { user });  // For regular users, just pass the user object
    }
});


//Logout and destroy session
app.post("/logout", (request, response) => {
    request.session.destroy(() => {
        response.redirect("/");
    })
});


// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    //Load page
    response.render("signup");
});


// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    //Validate form input
    const { email, username, password } = request.body;
    if (!email || !username || !password) {
      return response.render("signup", { error: "Username, email, or password cannot be blank!" });
    }
    if (USERS.find((user) => user.email === email)) {
        return response.render("signup", { error: "Email already in use!" });
    }
    if (USERS.find((user) => user.username === username)) {
        return response.render("signup", { error: "Username already in use!" });
    }
    //Add user to array
    USERS.push({
        id: USERS.length +1, 
        email, 
        username, 
        password: bcrypt.hashSync(password, SALT_ROUNDS), 
        role: "regular"
    });
    return response.redirect('/login');
});


// Start server
app.listen(PORT, () => {
    console.log('Server running at http://localhost:3000');
});
