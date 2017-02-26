// 全局变量
var app = app || {};

(function() {

    app.googleMap = {
        map: {},
        markers: [],
        locations: locations, // 初始化数据
        initMap: function() {
            // 初始化地图
            this.map = new google.maps.Map(document.getElementById('map'), {
                center: {
                    lat: 31.230416,
                    lng: 121.473701
                },
                // mapTypeControlOptions: {
                //     mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
                // },
                scrollwheel: false,
                mapTypeControl: false, // 禁止用户修改为其他类型的地图
                zoom: 12
            });

            // 初始化信息窗口
            var largeInfoWindow = new google.maps.InfoWindow();
            // 自定义markers的样式
            var defaultIcon = makeMarkerIcon('0091ff');

            // 当用户鼠标经过某个marker的时候，该marker高亮显示
            var highlightedIcon = makeMarkerIcon('ffff24');

            // 遍历地点数组，然后为每个地点创建一个marker
            // 暂未设置到地图上
            for (var i = 0; i < this.locations.length; i++) {
                var position = this.locations[i].position;
                var title = this.locations[i].title;
                // 为每一个地点创建一个marker
                // marker是有ID的
                var marker = new google.maps.Marker({
                    position: position,
                    title: title,
                    icon: defaultIcon,
                    animation: google.maps.Animation.DROP,
                    id: i
                });
                // 把创建好的marker放到markers数组中缓存
                this.markers.push(marker);
                // 为每一个marker注册一个单击事件处理程序
                marker.addListener('click', function() {
                    // 为每一个marker添加一个信息窗口
                    populateInfoWindow(this, largeInfoWindow);
                });
                // 为每一个marker注册两个鼠标事件监听程序
                marker.addListener('mouseover', function() {
                    this.setIcon(highlightedIcon);
                });
                marker.addListener('mouseout', function() {
                    this.setIcon(defaultIcon);
                })
            }

            // 将marker显示到地图上
            showListings();

            // 监听搜索框的change事件，更新标记
            document.getElementById('searchBox').addEventListener('change', function() {
                showListings();
            });

            // document.querySelector('.location-item').addEventListener('click', function() {
            //   console.log(this.id);
            // });

        },
        // 功能：当用户点击列表中的地点时，高亮显示对象的marker
        // 这里仅有event handler
        // 在list - view model 中监听调用
        toggleMarker: function() {
          var _markers = app.googleMap.markers;
            for (var i = 0; i < _markers.length; i++) {
                //
                _markers[i].setIcon(makeMarkerIcon('0091ff'));
            }
            if (!!app.viewModel.currentLocation()) {
                var selectedMarker = _markers.filter(function(ele) {
                    return ele.id == app.viewModel.currentLocation().id;
                });
                // console.log(selectedMarker);
                selectedMarker[0].setIcon(makeMarkerIcon('ffff24'));
            }
        }
    };

    /*
     * 用到的函数
     *
     */

    // 函数：适应视口地`渲染`所有markers
    function showListings() {
        // 初始化地图边界
        var bounds = new google.maps.LatLngBounds();
        // 下面的私有变量不能拿出去，也许和google map本身的架构有关
        var _markers = app.googleMap.markers;
        var _map = app.googleMap.map;

        // 满足筛选条件的地点
        var _locations = app.viewModel.filterLocations();

        // 清空所有的标记
        for (var i = 0; i < _markers.length; i++) {
            // 隐藏markers
            _markers[i].setMap(null);
        }


        // 过滤markers
        _markers = _markers.filter(function(val) {
            return app.googleMap.locations.some(function(ele) {
                return ele.id == val.id;
            });
        });

        // 当没有满足条件的地点时，清楚所有标记
        for (var i = 0, len = _markers.length; i < len; i++) {
            if (len === 0) {
                _markers[i].setMap(null);
            } else {
                // 指定marker渲染所在地图
                _markers[i].setMap(_map);
                // 把每一个标记纳入边界内
                bounds.extend(_markers[i].position);
                // 让地图适应边界显示
                _map.fitBounds(bounds);
            }
        }
    }


    // 点击marker时，显示信息窗口
    function populateInfoWindow(marker, infoWindow) {
        // 先检查一下当前marker是否已经打开过窗口了
        if (infoWindow.marker !== marker) {
            infoWindow.marker = marker;
            infoWindow.setContent('<div>' + marker.title + '</div>');
            infoWindow.addListener('closeClick', function() {
                infoWindow.setMarker(null);
            });

            infoWindow.open(app.googleMap.map, marker);
        }
    }

    // 自定义marker样式
    function makeMarkerIcon(markerColor) {
        var image = {
            url: 'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
                '|40|_|%E2%80%A2',
            size: new google.maps.Size(21, 34),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(10, 34),
            scaledSize: new google.maps.Size(21, 34)
        };
        return image;
    }

})();
