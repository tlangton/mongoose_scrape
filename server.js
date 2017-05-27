// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = require("bluebird");

// Initialize Express
var app = express();
app.set("view engine", "hbs");

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
var databaseUri = "mongodb://localhost/mongooseScraper";

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect(databaseUri);
}

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes
// ======

var wwwUrl = "http://www.reuters.com";

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.reuters.com/news/archive/topNews/", function(
    error,
    response,
    html
  ) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    let stories = [];

    $(".story").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element).find("h3.story-title").text().trim();
      result.body = $(element).find("p").text();
      result.link = $(element).find("a").attr("href");
      result.image = $(element).find("img").attr("org-src");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      return entry.save().then(story => stories.push(story)).catch(e => {});
    });

    console.log("STORIES", stories);

    Promise.all(stories).then(() => res.send("Done"));
    // .catch(e => res.send("DONE"));
  });
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    } else {
      // Or send the doc to the browser as a json object
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    // now, execute our query
    .exec(function(error, doc) {
      // Log any errors
      if (error) {
        console.log(error);
      } else {
        // Otherwise, send the doc to the browser as a json object
        res.json(doc);
      }
    });
});

// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  console.log("\n");
  console.log("REQ PARAMS IN comments POST no parseInt", req.params.id);
  console.log("\n");
  console.log("REQ BODY In comments POST", req.body.body);

  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    } else {
      // Otherwise
      // Use the article id to find and update it's note
      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { note: doc._id } }
      )
        // Execute the above query
        .exec(function(err, doc) {
          // Log any errors
          if (err) {
            console.log(err);
          } else {
            // Or send the document to the browser
            res.send(doc);
          }
        });
    }
  });
});

// Render hbs template
app.get("/", (req, res) => {
  Article.find({}, function(error, articles) {
    res.render("index", { articles: articles });
  }).sort({ date: "descending" });
});

// Listen on port 3000 if not heroku
app.listen(process.env.PORT || 3000, function() {
  console.log("App running on port 3000!");
});
