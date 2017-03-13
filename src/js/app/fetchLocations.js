var app = app || {};

(function() {
    'use strict';

    // URL of fetching foursquare.com data
    var apiURL = 'https://api.foursquare.com/v2/venues/explore';
    var foursquareClientID = '14FTN2LRVCBJHEV3FLELFRGEGR1XJWNPMOXJHNRISVEXKYL2';
    var foursquareSecret ='4SWVEZDF0C2SMFQQS5241GKRNNRHGQROZMXP2JI1DLFNPCOO';
    var foursquareVersion = '20170311';
    var queryCategory = 'sights';

    var foursquareURL = apiURL + '?client_id=' + foursquareClientID + '&client_secret=' + foursquareSecret +'&v=' + foursquareVersion + '&query=' + queryCategory + '&venuePhotos=1' + '&near=';

    // This method will be invoked when users update the city name.
    // Send asynchronous request via Ajax
    app.fetchLocations = function() {
        ajax({
            type:"get",
            url:foursquareURL + app.listViewModel.cityName(),
            // It is invoked when place data response successfully
            success:function(data){
                // `venues` caches an array of place objects
                var venues = data.response.groups[0].items;
                if (venues.length !== 0) {
                    /*
                     * Inform list view model
                     */
                    // Iterate venues and map the JSON data to an array of plain objects,
                    // then cached in a temporary array which will override the listViewModel.locationList property
                    var tempArr = [];
                    venues.forEach(function(item,index) {
                        tempArr.push(new Location(item,index));
                    });
                    app.listViewModel.locationList(tempArr);
                    // Reset some properties of listViewModel with default values
                    app.listViewModel.resetListDetails();

                    /*
                     * Inform google map
                     */
                    // Remove all listeners created using `google.maps.event.addListener` method in google map (if any)
                    if (app.googleMap.listenerIDs.length!==0) {
                        app.googleMap.listenerIDs.forEach(function(item) {
                            item.remove();
                        });
                        app.googleMap.listenerIDs.length = 0;
                    }
                    // Reset some properties of googleMap with default values
                    app.googleMap.resetMap();
                    // Clear markers array
                    app.googleMap.markers.length = 0;
                    // Create markers of all locations
                    app.googleMap.createMarkers();
                    // Show markers of locations meeting filter condition
                    app.googleMap.showMarkers();
                } else {
                    // Response successfully, but `venues` array is empty
                    // For example, searching `world` city will encounter this issue
                    alert('Sorry...there is no recommended places in ' + app.listViewModel.cityName() + ', please try another city.');
                }
            },
            // Handle the data requests that fail based on different error types
            error:function(status,text,data){
                if (data.meta) {
                    switch (data.meta.errorType) {
                        case 'failed_geocode':
                            alert("Couldn't find " + app.listViewModel.cityName() + ", please try another city.");
                            break;
                        case 'param_error':
                            if (!app.listViewModel.cityName()) {
                                alert("Please provide a city name.");
                            } else {
                                alert("This APP couldn't fetch place data correctly. Please give developers your feedback. Contact: gaoshu883@gmail.com");
                            }
                            break;
                        case 'rate_limit_exceeded':
                            alert('The APP is too hot, please wait a clock.');
                            break;
                        case 'not_authorized':
                            alert('Sorry, you are not allowed to see this information due to privacy restrictions');
                            break;
                        default:
                            alert('Sorry, there may be an error somewhere. Please refresh again.');
                    }
                }
            }
        });
    };

    // Location class
    // Mapper: mapping from JSON data to plain objects
    // @param {object} item -venue data
    // @param {number} index - ID of each venue
    function Location(item,index) {
        var venue = item.venue;
        this.name = venue.name;
        this.contact = venue.contact.formattedPhone || '';
        this.address = venue.location.formattedAddress || [];
        this.geoLocation = {
            lat: venue.location.lat || null,
            lng: venue.location.lng || null
        };
        this.rating = venue.rating || null;
        this.ratingColor = venue.ratingColor || '';
        this.url = venue.url || '';
        this.hours = venue.hours || null; // object
        this.category = venue.categories[0].name || '';
        this.photo = {
            prefix: venue.photos.groups[0].items[0].prefix,
            suffix: venue.photos.groups[0].items[0].suffix,
            visibility:venue.photos.groups[0].items[0].visibility
        };
        this.id = index; // simple ID of each place matching with ID of each marker
    }
})();
