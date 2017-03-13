var app = app || {};

(function() {
    // Inspired by http://stackoverflow.com/questions/9206013/javascript-fuzzy-search
    // Fuzzy search algorithm: Loop through needle letters and check if they occur in the same order in the haystack (reference of the original answer)
    // @param {string} libraryStr - the string that be compared to
    // @param {string} inputStr - the string that users input(will be split into an array of strings without empty values)
    // return true/false
    function fuzzySearch(libraryStr,inputStr) {
      // The method to remove empty values of an array is inspired by http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
        var inputArr = inputStr.split(' ').filter(Boolean);
        var hay = libraryStr.toLowerCase(),
            i = 0,
            pos = -1,
            l;
        var satisfyFilter = inputArr.some(function(itemStr) {
            itemStr = itemStr.toLowerCase();
            for (; l = itemStr[i++];) {
                if (!~(pos = hay.indexOf(l, pos + 1))) {
                    return false;
                }
            }
            return true;
        });

        return satisfyFilter;
    }

    var ListViewModel = function() {
        'use strict';

        var self = this;
        // Caching all venues objects in an array
        // Update when fetching new data from foursquare.com
        self.locationList = ko.observableArray();

        /*
         * Filter locations
         *
         * There are two types of locations filtering:
         *   - User inputing
         *   - Choosing category
         *
         */

        // Caching the filter string that users input
        // When the data changes, UI will update immediately
        self.actualFilterName = ko.observable();
        // An observable array of location categories
        // Update when fetching new data from foursquare.com
        // Two properties: name and id
        // name - {string} the category of venues
        // id - {[number]} ids of all venues which belong to certain category
        self.categoryList = ko.computed(function() {
            var list = [];
            // Iterate all venues and discriminate whether each venue's category has already existed in the category list array or not.
            this.locationList().forEach(function(item) {
              var tempArr = [];
              var itemIsExist = false;
              // Discriminate whether the current venue's category is equal to one of category list.
              itemIsExist = list.some(function(ele) {
                tempArr.push(ele);
                return ele.name === item.category;
              });
              // If current venue's category doesn't exist, a new category object will be created.
              // Otherwise, the current venue's id will be pushed into the id array of this category.
              if (!itemIsExist) {
                list.push({
                name: item.category,  // string || null
                id: [item.id]     // array of number
              });
              } else {
                list[tempArr.length - 1].id.push(item.id);
              }
            });
            return list;
        },this);

        // It is a private observable object with two properties: name and id
        // name - {string} store the filter string coming from users inputing or category choosing
        // id - {array} if the filter string comes from users inputing, `id` is empty array; if coming from category choosing, `id` is an array of locations' IDs.
        var _currentFilter = ko.observable({
            name: ko.observable(),
            id: ko.observableArray()
        });

        // Two different filtering algorithms are used to filter locations
        self.filterLocations = ko.computed(function() {
            if (!_currentFilter().name() || _currentFilter().name().split(' ').filter(Boolean).length === 0) {
                // Original locationList array will return if there is no input or only whitespace string
                return self.locationList();
            } else if (_currentFilter().id().length !== 0) {
                // Category filter algorithm
                // Filter locations based on the id property of `currentFilter` object
                var tempArr = [];
                _currentFilter().id().forEach(function(item) {
                    tempArr.push(self.locationList()[item]);
                });
                // Clear out the id array
                _currentFilter().id().length = 0;
                return tempArr;
            } else {
                // Input filter algorithm
                // `ko.utils.arrayFilter` method is used for filtering
                // Inspired by http://stackoverflow.com/questions/20857594/knockout-filtering-on-observable-array
                return ko.utils.arrayFilter(self.locationList(), function(item) {
                    // The core algorithm is fuzzy search
                    // The location name and category string split into an array of strings without empty strings.
                    // The filter string that users input will also split into an array of strings without empty strings. (done within the fuzzySearch function)
                    // As long as there is one element of input array matching with one element of location array, this location meet the filter condition.
                    var tempArr = (item.name.split(' ').concat(item.category.split(' '))).filter(Boolean);
                    return tempArr.some(function(prop) {
                        return fuzzySearch(prop, _currentFilter().name());
                    });
                });
            }
        });

        // It is a private function that sets current filter object and is invoked within the `fetchLocations` method
        // @param: {object} data - the object users click
        var _setCurrentFilter = function(data) {
            if (!!data) {
                if (data.id && data.name !== _currentFilter().name()) {
                    // It is category filter
                    _currentFilter().name(data.name);
                    _currentFilter().id(data.id);
                    // Show the category name in the search box
                    self.actualFilterName(data.name);
                } else if (!data.id && self.actualFilterName() !== _currentFilter().name()) {
                    // It is input filter
                    _currentFilter().name(self.actualFilterName());
                    _currentFilter().id().length = 0;
                }
            }
        };

        /*
         * Search bar view and data bind
         *
         */

        // Caching the status of category filter panel: open is true; close is false; close is default.
        self.filterStatus = ko.observable(false);
        // Caching the status of search panel
        self.searchBoxSelected = ko.observable(false);

        // It is invoked when input box is clicked or text is input or selected. (open search panel)
        self.setSearchFocused = function() {
            self.searchBoxSelected(true);
            self.filterStatus(false);
        };

        self.cityName = ko.observable('');

        // It is a private variable
        var _cityNameChanged = false;
        // It is called when users change the city name
        self.changeCityName = function() {
            _cityNameChanged = true;
        };

        // It is invoked when users click search button, dealing with three conditions:
        //     - Only filter condition changes
        //     - Only city name changes
        //     - Both change
        // Send request to foursquare.com when the city name changes
        // @param {object} data - the object that users interact with
        self.fetchLocations = function(data) {

            self.searchBoxSelected(false);

            if (_cityNameChanged&&self.actualFilterName()!==_currentFilter().name()) {
                self.listPretendInvisible(true);
            }

            _setCurrentFilter(data);

            if (_cityNameChanged) {
                _cityNameChanged = false;
                app.fetchLocations();
            } else {
                self.resetListDetails();
                app.googleMap.resetMap();
                app.googleMap.showMarkers();
            }
            // Prevent default event of href attribute of <a> tag
            return false;
        };

        // Invoke `fetchLocations` method when users press enter key
        // @param {object} data - the object that users interact with (ie listViewModel)
        // @param {object} event - the event object
        self.enterKeyUp = function(data,event) {
            if (event.keyCode === 13) {
                self.fetchLocations(data);
            }
        };

        // This observable variable is designed for fixing a bug existing when both filter condition and city name change
        // It becomes `true` when both change
        self.listPretendInvisible = ko.observable(false);
        // It is invoked when users click filter button,and toggles the status of filter panel
        self.toggleFilter = function() {
            if (self.filterStatus()) {
                self.filterStatus(false);
            } else {
                self.filterStatus(true);
                self.searchBoxSelected(false);
            }
            // Prevent default event of href attribute of <a> tag
            return false;
        };

        /*
         * Locations list view and data bind
         *
         */

        // Caching the status of list panel: slide-in is `true`; slide-out is `false`
        self.listStatus = ko.observable(true);
        // If listStatus is true, list panel slides in; otherwise slides out.
        self.listCSS = ko.computed(function() {
            return self.listStatus() ? 'search-show' : 'search-hide';
        });
        // It is invoked when users click list/map button, and toggles the status of list panel.
        self.toggleList = function() {
            // Firstly, reset status of other components
            self.filterStatus(false);
            self.searchBoxSelected(false);
            self.detailsStatus(false);
            self.mapStatus(false);

            // Then toggle the list status
            this.listStatus() ? self.listStatus(false) : this.listStatus(true);

            // Prevent default event of href attribute of <a> tag
            return false;
        };

        /*
         * Location details view and data bind
         *
         */

        // Caching the current location which is selected by users
        self.currentLocation = ko.observable();
        // If no accessible images are responsed from foursquare.com, this placeholder will be used
        self.imageHolder = "http://lorempixel.com/500/300";
        // Caching the status of details panel
        self.detailsStatus = ko.observable(false);
        // Store the object where details are triggered from
        self.whoTriggerDetails = null;

        // Show location details panel
        // It is invoked when users choose a certain location from the list or click a marker in google map
        // @param {object} data - the location object users click on
        self.showDetails = function(data) {
            // 1. Show location details panel
            self.detailsStatus(true);
            // 2. Reset status of other components
            self.mapStatus(false);
            self.listStatus(false);
            self.filterStatus(false);
            self.searchBoxSelected(false);
            if (data !== self.currentLocation()) {
                // 3. Set the location as the current location
                self.currentLocation(data);
                app.googleMap.currentLocation = data;
            }
            // 4. Show the infoWindow of the current location in google map
            app.googleMap.toggleMarker(data.id);

            // 5. Caching the object which clicks on as the target one where details panel is triggered from
            self.whoTriggerDetails = data;

            // Prevent default event of href attribute of <a> tag
            return false;
        };
        // Hide location details panel, and go back to the prior status, only triggered in portrait orientation
        self.hideDetails = function() {
            if (Object.prototype.toString.call(self.whoTriggerDetails) === '[object Object]') {
                self.listStatus(true);
            }
            self.detailsStatus(false);
        };

        // In portrait orientation(usually treated as mobile mode), the map will show if this variable becomes `true`
        self.mapStatus = ko.observable(false);
        // It exists only in portrait orientation, and triggered when users click the show map button.
        self.showMap = function() {
            self.mapStatus(true);
        };

        // Toggle the text of list/map menu based on status of different components
        self.toggleMenuText = ko.computed(function() {
            if (!self.mapStatus() && self.listStatus()) {
                return 'Map';
            } else {
                return 'List';
            }
        });

        // Reset status of all necessary components of this view model
        self.resetListDetails = function() {
            self.filterStatus(false);
            self.detailsStatus(false);
            self.mapStatus(false);
            self.listStatus(true);
            self.currentLocation(null);
            self.listPretendInvisible(false);
            _cityNameChanged = false;
        };
    };
    // Create a new object of this view model as a property of app object namespace
    app.listViewModel = new ListViewModel();
})();
