//--------------------------------
// by: Anneke ter Schure, 6084087
//
// make localhost server: python -m SimpleHTTPServer
// use url: http://localhost:8000/index.html
//--------------------------------

var data;

d3.json("/Data/bioInteractions.json", function(error, json) {
  if (error) return console.warn(error);
  data = json;
  plotNetwork();
});
