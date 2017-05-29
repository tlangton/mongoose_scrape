var wwwUrl = "http://www.reuters.com";
// Whenever someone clicks a p tag

$("#scrape").click(function() {
  $.get("/scrape").then(function() {
    window.location.reload();
  });
});

$(document).on("click", ".new-note", function() {
  // Empty the notes from the note section
  $(".notes").empty();
  $(".notes").slideUp();
  // Save the id from the p tag
  var thisId = $(this).closest(".article").attr("data-id");
  var $notes = $(this).closest(".article").find(".notes");
  var $button = $(this);
  // Now make an ajax call for the Article
  $.get("/articles/" + thisId)
    // With that done, add the note information to the page
    .done(function(article) {
      console.log(article);
      $button.find(".badge").html(article.notes.length);

      // A textarea to add a new note body
      $notes.append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $notes.append(
        "<button class='btn btn-default btn-sm' data-id='" +
          article._id +
          "' id='savenote'>Save Note</button>"
      );
      $(".notes").slideDown();

      article.notes.forEach(function(note) {
        $notes.append("<div class='note'> " + note.body + "</div>");
      });
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.post("/articles/" + thisId, {
    // Value taken from title input
    title: $("#titleinput").val(),
    // Value taken from note textarea
    body: $("#bodyinput").val()
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $(".notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});
