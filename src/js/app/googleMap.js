var app = app || {};

(function() {
    'use strict';

    app.googleMap = {
        map: {}, // the initial map object
        markers: [], // markers of all venues in a certain city
        currentLocation: null, // the location users select
        currentMarker: null, // the marker users select
        activatedMarker: false, // the status of the selected marker
        bounds: null, // the initial map bounds containing all venues in a certain city
        largeInfoWindow: null, // the infoWindow object
        isMobile: false, // orientation of device: portrait is true; landscape is false
        listenerIDs:[], // Caching all listeners'id created using `google.maps.event.addListener` method in google map

        // Initialize the google map
        // It is invoked when google map data is fetched successfully
        initMap: function() {
            var self = this;

            this.map = new google.maps.Map(document.getElementById('map'), {
                center: new google.maps.LatLng(34.53,108.92),
                scrollwheel: true,
                zoom: 4
            });

            // Determine the orientation of the device
            this.isMobile = window.innerHeight > window.innerWidth ? true : false;
            // Redetermine the orientation of the device when users change the size of viewport
            window.addEventListener('resize',
                function() {
                    self.isMobile = window.innerHeight > window.innerWidth ? true : false;
                }, false);

            // Clear out the timer set for handling the google map loading error
            clearTimeout(app.googleMapRequestTimeout);
        },

        // Create markes of all venues of a certain city, It is triggered when new locations data are fetched from foursquare.com
        createMarkers: function() {
            var self = this;

            this.largeInfoWindow = new google.maps.InfoWindow();
            this.bounds = null;
            // Customize the style of markers
            var defaultIcon = _makeMarkerIcon('268bd2');
            var highlightedIcon = _makeMarkerIcon('ffff24');

            var locations = app.listViewModel.locationList();
            // Create markers for all locations
            // Each location and its corresponding marker share the same id value
            for (var i = 0; i < locations.length; i++) {
                var markerOptions = {
                        position: locations[i].geoLocation,
                        address: locations[i].address[0] || '',
                        category: locations[i].category || '',
                        title: locations[i].name,
                        icon: defaultIcon,
                        animation: google.maps.Animation.DROP,
                        id: locations[i].id
                };
                var marker = new google.maps.Marker(markerOptions);
                this.markers.push(marker);

                // Add click event handler to each marker
                // 1. The clicked marker set to the target marker
                // 2. The clicked location set to current location
                // 3. Show the infoWindow of the current location
                // 4. Show details panel of current location if the device is in landscape orientation
                var listenerID1 = google.maps.event.addListener(marker, 'click', function() {
                    self.currentMarker = this;
                    self.currentLocation = locations[this.id];
                    self.showMarkerInfo(this, self.largeInfoWindow);
                    if (!self.isMobile) {
                        self.showDetails();
                    }
                });
                // Add mouseover and mouseout event handlers to each marker
                var listenerID2 = google.maps.event.addListener(marker, 'mouseover', function() {
                    this.setIcon(highlightedIcon);
                });
                var listenerID3 = google.maps.event.addListener(marker, 'mouseout', function() {
                    this.setIcon(defaultIcon);
                });
                // Caching all listeners'id created using `google.maps.event.addListener` method in google map
                this.listenerIDs.push(listenerID1,listenerID2,listenerID3);
            }
        },

        // Show all markers meeting filter condition
        showMarkers: function() {
            // If locations data are newly fetched from foursquare.com, the map bounds will be reinitialized. If not, ignoring this code block
            if (!this.bounds) {
                this.bounds = new google.maps.LatLngBounds();
                for (var i = 0, len = this.markers.length; i < len; i++) {
                    this.bounds.extend(this.markers[i].position);
                }
                this.map.fitBounds(this.bounds);
            }

            // Filter markers according to ids of locations that meet the filter condition
            var locations = app.listViewModel.filterLocations();
            var markers = [];
            locations.forEach(function(item) {
                markers.push(this.markers[item.id]);
            },app.googleMap);

            // Show markers in the map
            var len = markers.length;
            if (len === 0) {
                return;
            } else {
                for (var j = 0; j < len; j++) {
                    markers[j].setMap(this.map);
                    // Each marker has a label
                    markers[j].setLabel({
                        fontSize: '12',
                        text: (j + 1).toString()
                    });
                }
                this.map.fitBounds(this.bounds);
            }
        },

        // It is triggered when users click on an item of locations list
        // 1. Set the current marker
        // 2. Show marker's information(infoWindow, highlight color, activated status)
        toggleMarker: function(id) {
            if (this.markers[id] !== this.currentMarker) {
                // If the marker isn't the previous marker
                this.currentMarker = this.markers[id];
                this.showMarkerInfo(this.currentMarker, this.largeInfoWindow);
            } else if (!this.activatedMarker) {
                // The marker is the previous one, but it has been closed and has to be activated
                this.showMarkerInfo(this.currentMarker, this.largeInfoWindow);
            }
        },

        // It is invoked when users click a marker or click a list item
        // Show marker's information
        // 1. Show infoWindow
        // 2.Highlight marker,
        // 3. Set the current marker as the activated status
        showMarkerInfo: function(marker, infoWindow) {
            var self = this;

            if (infoWindow.marker !== marker) {
                if (this.activatedMarker) {
                    infoWindow.marker.setIcon(_makeMarkerIcon('268bd2'));
                }
                infoWindow.marker = marker;
                this.activatedMarker = true;
                marker.setIcon(_makeMarkerIcon('ffff24'));

                infoWindow.setOptions({
                    content: '<div id="infoWindow"><div>' + marker.title + '</div>' +
                        '<div class="infoWindow-category">' + marker.category + '</div>' +
                        '<div class="infoWindow-address">' + marker.address + '</div>' +
                        '<div class="details-link"><a title="For more details about this place" href="#" onclick="javascript:app.googleMap.showDetails(this)">Location details</a></div></div>',
                    maxWidth: 250
                });

                // Load CSS file dynamically and style the infoWindow content
                // Inspired by http://stackoverflow.com/questions/574944/how-to-load-up-css-files-using-javascript
                var cssId = 'infoWindowCSS';
                if (!document.getElementById(cssId))
                {
                    // console.log('Load CSS file dynamically and successfully');
                    var head  = document.getElementsByTagName('head')[0];
                    var link  = document.createElement('link');
                    link.id   = cssId;
                    link.rel  = 'stylesheet';
                    link.type = 'text/css';
                    link.href = 'css/infoWindow.css';
                    head.appendChild(link);
                }

                var listenerID4 = google.maps.event.addListener(infoWindow, 'closeclick', function() {
                    self.hideMarkerInfo(marker, infoWindow);
                });
                this.listenerIDs.push(listenerID4);
            }

            infoWindow.open(app.googleMap.map, marker);
        },

        // It is triggered when users click the close button of infoWindow or new data is loaded
        // Close the infoWindow, restore the default color and set the marker to inactivated status
        // @param {object} marker - the current marker
        // @param {object} infoWindow - the current infoWindow
        hideMarkerInfo: function(marker, infoWindow) {
            marker.setIcon(_makeMarkerIcon('268bd2'));
            infoWindow.close();
            this.activatedMarker = false;
        },

        // It is invoked when filter condition changes or new data are fetched
        // Reset the status of some components of google map
        //          1. marker's information
        //          2. current marker
        //          3. current location
        //          4. Hide all markers
        resetMap: function() {
            if (this.currentMarker) {
                if (this.activatedMarker) {
                    this.hideMarkerInfo(this.currentMarker, this.largeInfoWindow);
                }
                this.currentMarker = null;
            }
            this.currentLocation = null;
            if (this.markers.length!==0) {
                this.markers.forEach(function(item) {
                    item.setMap(null);
                });
            }
        },

        // It is triggered when users click the `show details` link in the infoWindow content
        // Only exist in the portrait orientation
        // @param {object} ele - the object that is clicked
        showDetails: function(ele) {
            app.listViewModel.showDetails(this.currentLocation);
            app.listViewModel.whoTriggerDetails = ele;
        }
    };

    // Customize the style of markers
    // @param {string} markerColor - Hexadecimal color code
    function _makeMarkerIcon(markerColor) {
        var image = {
            url: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|' + markerColor +
                '|ffffff',
            size: new google.maps.Size(21, 34),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(10, 34),
            scaledSize: new google.maps.Size(21, 34),
            labelOrigin: new google.maps.Point(11, 11)
        };
        return image;
    }
})();
