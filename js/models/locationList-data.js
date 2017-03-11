// 全局变量
var app = app || {};
// namespace
(function() {
    // URL of fetching foursquare.com data
    var apiURL = 'https://api.foursquare.com/v2/venues/explore';
    var foursquareClientID = '14FTN2LRVCBJHEV3FLELFRGEGR1XJWNPMOXJHNRISVEXKYL2'
    var foursquareSecret ='4SWVEZDF0C2SMFQQS5241GKRNNRHGQROZMXP2JI1DLFNPCOO';
    var foursquareVersion = '20170311';
    var queryRadius = 1000;
    var queryCategory = 'sights';

    var foursquareURL = apiURL + '?client_id=' + foursquareClientID + '&client_secret=' + foursquareSecret +'&v=' + foursquareVersion + '&radius='+ queryRadius + '&query=' + queryCategory + '&venuePhotos=1' + '&near=';

    // This method will be invoked when users update the city name.
    // Send asynchronous request via Ajax
    app.fetchLocations = function() {
        ajax({
            type:"get",
            url:foursquareURL + app.listViewModel.cityName(),
            success:function(data){
                // `venues` caches an array of place objects
                var venues = data.response.groups[0].items;
                if (venues.length !== 0) {
                    // Iterate venues and map the JSON data to an array of plain objects, then cached in the listViewModel's locationList property
                    // 这里是临时数组 暂时缓存所有地点数组
                    // 每次数据响应后调用success回调函数时
                    // 都会重新创建这个临时数组
                    // 保证locationList都是最新fetch回来的数据
                    var _tempArr = [];

                    // 先存放在临时数据里
                    venues.forEach(function(item,index) {
                        _tempArr.push(new Location(item,index));
                    });
                    // 重置list和deitails
                    app.listViewModel.resetListDetails();
                    // 更新地点数据（重写）
                    // 完成地点筛选
                    app.listViewModel.locationList(_tempArr);
                    // remove all listeners in google map
                    if (app.googleMap.listenerIDs.length!==0) {
                        app.googleMap.listenerIDs.forEach(function(item) {
                            item.remove();
                        });
                    }
                    // 重置地图
                    app.googleMap.resetMap();
                    // 清空markers数组
                    app.googleMap.markers = [];
                    // （重新）创建所有地点的markers
                    app.googleMap.createMarkers();
                    // 显示markers
                    app.googleMap.showMarkers();
                } else {
                    alert('Sorry...there is no recommended places in ' + app.listViewModel.cityName() + ', please try another city.');
                }

            },
            // 当没有从 foursquare 成功获取数据时
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
    // Mapper: mapping from JSON data to plain object(if need, to observables)
    function Location(item,index) {
        var _venue = item.venue;
        this.name = _venue.name;
        this.contact = _venue.contact.formattedPhone || '';
        this.address = _venue.location.formattedAddress || []; // array
        this.geoLocation = {
            lat: _venue.location.lat || null,
            lng: _venue.location.lng || null
        }; // object
        this.rating = _venue.rating || null;
        this.ratingColor = _venue.ratingColor || ''; // string
        this.url = _venue.url || '';
        this.hours = _venue.hours || null; // object
        this.category = _venue.categories[0].name || ''; // string
        this.photo = {
            prefix: _venue.photos.groups[0].items[0].prefix,
            suffix: _venue.photos.groups[0].items[0].suffix,
            visibility:_venue.photos.groups[0].items[0].visibility
        };
        this.id = index; // simple ID of each place match with ID of each marker
    }
})();
