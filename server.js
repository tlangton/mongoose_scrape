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
mongoose.Promise = Promise;

// Initialize Express
var app = express();

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

// First, tell the console what server.js is doing
// console.log(
//   "\n***********************************\n" +
//     "my trial Reuters" +
//     "\n***********************************\n"
// );

// Making a request call for reddit's "webdev" board. The page's HTML is saved as the callback's third argument
request("http://www.reuters.com/news/archive/topNews", function(
  error,
  response,
  html
) {
  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(html);

  // An empty array to save the data that we'll scrape
  var result = [];

  // With cheerio, find each p-tag with the "title" class
  // (i: iterator. element: the current element)
  $(".story").each(function(i, element) {
    // Save the text of the element (this) in a "title" variable

    // console.log(element);

    var storyTitle = $(element).find("h3.story-title").text();
    storyTitle = storyTitle.trim();
    var storySrc = $(element).find("p").text();
    var storyImg = $(element).children().attr("href");
    // Save these results in an object that we'll push into the result array we defined earlier
    result.push({
      title: storyTitle,
      body: storySrc,
      image: storyImg
    });
  });

  // Log the result once cheerio analyzes each of its selected elements
  // console.log(result);
});

// Routes
// ======

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
    $(".story").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element).find("h3.story-title").text();
      result.body = $(element).find("p").text();

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        } else {
          // Or log the doc
          console.log(doc);
        }
      });
    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
