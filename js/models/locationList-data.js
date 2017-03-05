(function() {
    // 请求一系列地点的URL
    var apiURL = 'https://api.foursquare.com/v2/venues/explore';
    var foursquareClientID = '14FTN2LRVCBJHEV3FLELFRGEGR1XJWNPMOXJHNRISVEXKYL2'
    var foursquareSecret ='4SWVEZDF0C2SMFQQS5241GKRNNRHGQROZMXP2JI1DLFNPCOO';
    var foursquareVersion = '20170302';
    var queryLocation = 'New York';
    var queryRadius = 1000;
    var queryCategory = 'sights';

    var foursquareURL = apiURL + '?client_id=' + foursquareClientID + '&client_secret=' + foursquareSecret +'&v=' + foursquareVersion + '&near=' + queryLocation + '&radius='+ queryRadius + '&query=' + queryCategory + '&venuePhotos=1';

    // 利用Ajax技术异步请求数据
    ajax({
        type:"get",
        url:foursquareURL,
        // timeOut:5000,
        success:function(data){
            // venues 是一组对象
            var venues = data.response.groups[0].items;
            // iterate venues and mapp the JSON data to an array of plain objects then cache in the viewModel's locationList
            venues.forEach(function(item,index) {
                app.viewModel.locationList.push(new Location(item,index));
            });

            // var categoryArr = [];
            // app.viewModel.locationList().forEach(function(item) {
            //     if(categoryArr.indexOf(item.category) === -1) {
            //         categoryArr.push(item.category);
            //     }
            // });
            // console.log(categoryArr);
            // 创建所有地点的markers
            app.googleMap.createMarkers();
            // 初始化渲染所有的markers
            app.googleMap.showMarkers();
        },
        // 当没有从 foursquare 成功获取数据时
        error:function(){
            document.write('OHHHH, NOOOO, THERE IS AN ERROR. PLEASE TRY TO REFRESH!');
        }
    });

    // Location类
    // Mapper: mapping from JSON data to plain object(if need, to observables)
    function Location(item,index) {
        var _venue = item.venue;
        this.name = _venue.name;
        this.contact = _venue.contact.formattedPhone || null;
        this.address = _venue.location.formattedAddress || []; // array
        this.geoLocation = {
            lat: _venue.location.lat || null,
            lng: _venue.location.lng || null
        }; // object
        this.rating = _venue.rating || null;
        this.url = _venue.url || null;
        this.hours = _venue.hours || null; // object
        this.category = _venue.categories[0].name || null; // string
        this.photo = {
            prefix: _venue.photos.groups[0].items[0].prefix,
            suffix: _venue.photos.groups[0].items[0].suffix,
            visibility:_venue.photos.groups[0].items[0].visibility
        };
        this.id = index; // simple ID of fetched place
    }
})();
