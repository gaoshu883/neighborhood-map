// 全局变量
var app = app || {};

(function() {
    // 请求一系列地点的URL
    var apiURL = 'https://api.foursquare.com/v2/venues/explore';
    var foursquareClientID = '14FTN2LRVCBJHEV3FLELFRGEGR1XJWNPMOXJHNRISVEXKYL2'
    var foursquareSecret ='4SWVEZDF0C2SMFQQS5241GKRNNRHGQROZMXP2JI1DLFNPCOO';
    var foursquareVersion = '20170307';
    // var queryLocation = app.viewModel.cityName();
    var queryRadius = 1000;
    var queryCategory = 'sights';

    var foursquareURL = apiURL + '?client_id=' + foursquareClientID + '&client_secret=' + foursquareSecret +'&v=' + foursquareVersion + '&radius='+ queryRadius + '&query=' + queryCategory + '&venuePhotos=1' + '&near=';

    // 利用Ajax技术异步请求数据
    // 每当用户更新地点 则需要执行ajax请求
    app.fetchLocations = function() {
        // console.log('我被调用了');
        ajax({
            type:"get",
            url:foursquareURL + app.viewModel.cityName(),
            // timeOut:5000,
            success:function(data){
                // 这里是临时数组 暂时缓存所有地点数组
                // 每次数据响应后调用success回调函数时
                // 都会重新创建这个临时数组
                // 保证locationList都是最新fetch回来的数据
                var _tempArr = [];
                // venues 是一组对象
                var venues = data.response.groups[0].items;
                // iterate venues and mapp the JSON data to an array of plain objects then cache in the viewModel's locationList
                // 先存放在临时数据里
                venues.forEach(function(item,index) {
                    _tempArr.push(new Location(item,index));
                });
                // 重置list和deitails
                app.viewModel.resetListDetails();
                // 更新地点数据（重写）
                // 完成地点筛选
                app.viewModel.locationList(_tempArr);
                // remove all listeners in google map
                app.googleMap.listenerIDs.forEach(function(item) {
                    item.remove();
                });
                // 重置地图
                app.googleMap.resetMap();
                // 清空markers数组
                app.googleMap.markers = [];
                // （重新）创建所有地点的markers
                app.googleMap.createMarkers();
                // 显示markers
                app.googleMap.showMarkers();
            },
            // 当没有从 foursquare 成功获取数据时
            error:function(){
                alert('OHHHH, NOOOO, THERE IS AN ERROR. PLEASE TRY TO REFRESH!');
            }
        });
    };
    // 首次获取地点数据
    app.fetchLocations();

    // Location类
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
        this.id = index; // simple ID of fetched place
    }
})();
