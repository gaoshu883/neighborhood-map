var app = app || {};

// If google map data couldn't be fetched successfully
var googleMapRequestTimeout = setTimeout(function() {
  alert('Google map is not loaded, your request to google map may be rejected. Please refresh again, or check out your Internet connection restriction.');
}, 5000);

// Data binding
ko.applyBindings(app.listViewModel);

// Simulation of users input after Web APP is loaded
window.onload = function() {
  // Initialize the city name
  app.listViewModel.cityName('New York');
  // Fetch the initial city data
  app.fetchLocations();
};





