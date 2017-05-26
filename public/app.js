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
  // Save the id from the p tag
  var thisId = $(this).closest(".article").attr("data-id");
  var $notes = $(this).closest(".article").find(".notes");
  // Now make an ajax call for the Article
  $.get("/articles/" + thisId)
    // With that done, add the note information to the page
    .done(function(data) {
      console.log(data);
      // The title of the articleo
      // $notes.append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $notes.append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $notes.append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $notes.append(
        "<button class='btn btn-default btn-sm' data-id='" +
          data._id +
          "' id='savenote'>Save Note</button>"
      );

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
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
