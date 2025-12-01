import express from "express";
import mysql from "mysql2/promise";
import session from "express-session";
import bcrypt from "bcrypt";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

//setting up database connection pool
const pool = mysql.createPool({
  host: "m7nj9dclezfq7ax1.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "gre4j1gd6jvlnoii",
  password: "wx84emrijmcvzw8j",
  database: "lgcyr22okbejp03i",
  connectionLimit: 10,
  waitForConnections: true,
});

// Send authenticated data to browser
app.use((req, res, next) => {
  res.locals.authenticated = req.session?.authenticated || false;
  next();
});

//routes
app.get("/", (req, res) => {
  res.render("home.ejs", {message: ""});
});

//login
app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  let passHash = "";

  let sql = `SELECT * 
              FROM users
              WHERE username = ?`;

  const [data] = await pool.query(sql, [username]);

  if (data.length > 0) {
    passHash = data[0].password;
  }

  const match = await bcrypt.compare(password, passHash);

  if (match) {
    req.session.authenticated = true;
    req.session.userID = data[0].userID;
    res.redirect("/authors");
  } else {
    res.render("home.ejs", { message: "Invalid username or password." });
  }
});

// Logout Route
app.get("/logout", async (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//Display form to update Author
app.get("/updateAuthor", isAuthenticated, async (req, res) => {
  let authorId = req.query.id;
  let sql = `SELECT *,
              DATE_FORMAT(dob,'%Y-%m-%d') ISOdob,
              DATE_FORMAT(dod,'%Y-%m-%d') ISOdod
              FROM authors
              WHERE authorId = ?`;
  const [authorInfo] = await pool.query(sql, [authorId]);
  res.render("updateAuthor.ejs", { authorInfo });
});

app.post("/updateAuthor", isAuthenticated, async (req, res) => {
  let authorId = req.body.authorId;
  let fName = req.body.fn;
  let lName = req.body.ln;
  let sql = `UPDATE authors SET firstName = ?, lastName = ? WHERE authorId = ?`;
  let sqlParams = [fName, lName, authorId];

  const [authorInfo] = await pool.query(sql, sqlParams);
  res.redirect("/authors");
});

//delete author
app.post("/deleteAuthor", isAuthenticated, async (req, res) => {
  console.log(req.body);
  let authorId = req.body.authorId;
  let sql = `DELETE FROM authors WHERE authorId = ?`;
  let sqlParams = [authorId];

  const [authorInfo] = await pool.query(sql, sqlParams);
  res.redirect("/authors");
});

app.post("/deleteQuote", isAuthenticated, async (req, res) => {
  console.log(req.body);
  let quoteId = req.body.quoteId;
  let sql = `DELETE FROM quotes WHERE quoteId = ?`;
  let sqlParams = [quoteId];

  const [quoteInfo] = await pool.query(sql, sqlParams);
  res.redirect("/quotes");
});

app.get("/authors", isAuthenticated, async (req, res) => {
  let sql = `SELECT authorId, firstName,lastName
            FROM authors
            ORDER BY lastName`;
  const [authors] = await pool.query(sql);
  res.render("authors.ejs", { authors });
});

//Display quotes and render quotes page
app.get("/quotes", isAuthenticated, async (req, res) => {
  let sql = `SELECT q.quote, q.quoteId, CONCAT(a.firstName, ' ',  a.lastName) AS name
            FROM quotes q
            JOIN authors a ON q.authorId = a.authorId
            ORDER BY lastName`;
  const [quotes] = await pool.query(sql);

  res.render("quotes.ejs", { quotes });
});

// Display form to add author
app.get("/addAuthor", isAuthenticated,(req, res) => {
  res.render("addAuthor.ejs");
});

// Add author info to DB
app.post("/addAuthor", isAuthenticated, async (req, res) => {
  let firstName = req.body.fn;
  let lastName = req.body.ln;
  let dob = req.body.dob;
  let dod = req.body.dod;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let bio = req.body.bio;
  let url = req.body.url;

  let sql = `INSERT INTO authors
                (firstName, lastName, dob, dod, sex, profession, country, biography, portrait)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  let sqlParams = [firstName, lastName, dob, dod, sex, profession, country, bio, url];

  const [rows] = await pool.query(sql, sqlParams);
  res.render("addAuthor.ejs");
});

// Display form to add quote
app.get("/addQuotes", isAuthenticated, async (req, res) => {
  let authorsSql = `SELECT authorId, CONCAT(firstName, ' ', lastName) AS fullName FROM authors`;
  const [authorsRows] = await pool.query(authorsSql);

  let categorySql = "SELECT DISTINCT category FROM quotes;";
  const [categoryRows] = await pool.query(categorySql);

  res.render("addQuotes.ejs", { authorsRows, categoryRows });
});

// Add quote to DB
app.post("/addQuote", isAuthenticated, async (req, res) => {
  let quote = req.body.quote;
  let category = req.body.category;
  let author = req.body.author;

  let sql = `INSERT INTO quotes
                (quote, authorId, category)
                VALUES (?, ?, ?)`;
  let sqlParams = [quote, author, category];

  const [rows] = await pool.query(sql, sqlParams);

  let authorsSql = `SELECT authorId, CONCAT(firstName, ' ', lastName) AS fullName FROM authors`;
  const [authorsRows] = await pool.query(authorsSql);

  let categorySql = "SELECT DISTINCT category FROM quotes;";
  const [categoryRows] = await pool.query(categorySql);
  res.render("addQuotes.ejs", { authorsRows, categoryRows });
});

app.get("/dbTest", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT CURDATE()");
    res.send(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Database error!");
  }
}); //dbTest

app.listen(3000, () => {
  console.log("Express server running");
});

//Middleware
function isAuthenticated(req, res, next) {
  if (!req.session.authenticated) {
    if (req.url !== "/login") {
      res.render("login", { message: "Please login to continue." });
    } else {
      res.render("login", { message: "" });
    }
  } else {
    next();
  }
}