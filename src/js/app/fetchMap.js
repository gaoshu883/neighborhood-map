var app = app || {};

app.fetchMap = function() {
  ajax({
    type:"get",
    url:'https://maps.googleapis.com/maps/api/js?key=AIzaSyC20z-8QU5oAG87tAJpuWcTa0sPnLTMzsg',
    dataType: 'jsonp',
    callbackName: 'app.googleMap.initMap'
  });
};