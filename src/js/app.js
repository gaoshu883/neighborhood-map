var app = app || {};

(function() {
    'use strict';
    // Fetch google map via JSONP
    app.fetchMap();

    // If google map data couldn't be fetched successfully
    app.googleMapRequestTimeout = setTimeout(function() {
        alert('Google map is not loaded, your request to google map may be rejected. Please refresh again, or check out your Internet connection restriction.');
    }, 5000);

    // Data binding
    ko.applyBindings(app.listViewModel);

    var mapId = document.querySelector('script[src$="callback=app.googleMap.initMap"]');
    // Fetch locations data after google map data is fetched successfully.
    mapId.addEventListener('load', function() {
        // Initialize the city name
        app.listViewModel.cityName('Washington D. C.');
        // Fetch the initial city data
        app.fetchLocations();
    });

    // Defer loading CSS file
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'http://weloveiconfonts.com/api/?family=fontawesome';
    head.appendChild(link);
})();
