// 全局变量
var app = app || {};

(function() {

    app.googleMap = {
        map: {},
        markers: [],
        // locations: null, // 初始化数据
        selectedMarker: null, // 缓存被选中的marker
        bounds: null, // 存储初始渲染的地图边界范围
        largeInfoWindow: null, // 存储信息窗口对象
        // 异步请求google地图后的回调函数
        initMap: function() {
            'use strict';

            var self = this;

            // 初始化地图
            this.map = new google.maps.Map(document.getElementById('map'), {
                // 初次选定的中心为上海
                center: {
                    lat: 31.230416,
                    lng: 121.473701
                },
                // mapTypeControlOptions: {
                //     mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
                // },
                scrollwheel: true,
                // mapTypeControl: false, // 禁止用户修改为其他类型的地图
                zoom: 12
            });



            // 将marker显示到地图上
            // 这里是关键，初次渲染必须等待响应数据返回
            // 那该监听什么事件呢？
            // showListings();

            // 监听搜索框的change事件，更新标记
            document.getElementById('searchBox').addEventListener('change', function() {
                self.showMarkers();
            });

            // document.querySelector('.location-item').addEventListener('click', function() {
            //   console.log(this.id);
            // });
        },
        // 为所有地点创建markers
        createMarkers: function() {
            var self = this;
            // 初始化信息窗口
            this.largeInfoWindow = new google.maps.InfoWindow();
            // 自定义markers的样式
            var defaultIcon = this.makeMarkerIcon('268bd2');

            // 当用户鼠标经过某个marker的时候，该marker高亮显示
            var highlightedIcon = this.makeMarkerIcon('ffff24');

            // 遍历地点数组，然后为每个地点创建一个marker
            // 暂未设置到地图上
            var _locations = app.viewModel.locationList();
            for (var i = 0; i < _locations.length; i++) {
                var markerOptions = {
                        position: _locations[i].geoLocation,
                        address: _locations[i].address[0] || '',
                        title: _locations[i].name,
                        icon: defaultIcon, // image
                        animation: google.maps.Animation.DROP,
                        id: _locations[i].id
                    }
                    // 为每一个地点创建一个marker
                    // marker和location拥有相同的ID
                var marker = new google.maps.Marker(markerOptions);
                // 把创建好的marker放到markers数组中缓存
                this.markers.push(marker);

                // 为每一个marker注册一个单击事件处理程序
                marker.addListener('click', function() {
                    // console.log('信息窗口被创建了');
                    // 为每一个marker添加一个信息窗口
                    self.populateInfoWindow(this, self.largeInfoWindow);
                });
                // 为每一个marker注册两个鼠标事件监听程序
                marker.addListener('mouseover', function() {
                    this.setIcon(highlightedIcon);
                });
                marker.addListener('mouseout', function() {
                    this.setIcon(defaultIcon);
                })
            }
        },
        // 函数：适应视口地`渲染`所有markers
        showMarkers: function() {
            // 初始化地图边界
            this.bounds = new google.maps.LatLngBounds();
            // 下面的私有变量不能拿出去，也许和google map本身的架构有关
            var _markers = app.googleMap.markers;
            var _map = app.googleMap.map;

            // 满足筛选条件的地点
            var _locations = app.viewModel.filterLocations();
            // console.log('我在这里');

            // 清空所有的标记
            for (var i = 0; i < _markers.length; i++) {
                // 隐藏markers
                _markers[i].setMap(null);
            }


            // 过滤markers
            _markers = _markers.filter(function(val) {
                return _locations.some(function(ele) {
                    return ele.id == val.id;
                });
            });

            for (var i = 0, len = _markers.length; i < len; i++) {
                if (len === 0) {
                    // 当没有满足条件的地点时，清除所有标记
                    _markers[i].setMap(null);
                } else {
                    // 指定marker渲染所在地图
                    _markers[i].setMap(_map);
                    // 每个marker显示一个编号
                    _markers[i].setLabel({
                        fontSize: '12',
                        text: (i + 1).toString()
                    });
                    // 把每一个标记纳入边界内
                    this.bounds.extend(_markers[i].position);
                    // 让地图适应边界显示
                    _map.fitBounds(this.bounds);
                }
            }
        },
        // 功能：当用户点击列表中的地点时，高亮显示对象的marker，map中心切换
        // 这里仅有event handler
        // 在list - view model 中监听调用
        toggleMarker: function() {
            // cache data
            var _markers = this.markers;

            if (app.viewModel.currentLocation()) {
                this.selectedMarker = _markers[app.viewModel.currentLocation().id];
                // console.log(selectedMarker);
                this.selectedMarker.setIcon(this.makeMarkerIcon('ffff24'));
                // change center of map to this marker
                // this.map.panTo(this.selectedMarker.position);
                // 地图重新渲染边界
                var _bounds = new google.maps.LatLngBounds(this.selectedMarker.position);
                this.map.fitBounds(_bounds);
                // 显示信息窗口
                this.populateInfoWindow(this.selectedMarker, this.largeInfoWindow);

            } else {
                this.selectedMarker.setIcon(this.makeMarkerIcon('268bd2'));
                // 当用户关闭详情框，地图恢复原貌，并更改中心
                this.map.fitBounds(this.bounds);
                this.map.panTo(this.selectedMarker.position);
                this.selectedMarker = null;
                // 关闭信息窗口
                // this.largeInfoWindow.setMarker(null);
            }
        },
        // 点击marker时，显示信息窗口
        populateInfoWindow: function(marker, infoWindow) {
            // 先检查一下当前marker是否已经有窗口打开
            if (infoWindow.marker !== marker) {
                infoWindow.marker = marker;
                infoWindow.setOptions({
                    content:'<div style="font:16px/1.5 sans-serif"><div>' + marker.title + '</div>' +
                        '<div style="font-size:12px">' + marker.address + '</div>' +
                        '<div style="font-weight: bold;cursor:pointer;color:#268bd2">Location details</div></div>',
                    maxWidth:250
                });
                infoWindow.addListener('closeClick', function() {
                    infoWindow.setMarker(null);
                });
            }
            infoWindow.open(app.googleMap.map, marker);
        },
        // 自定义marker样式
        makeMarkerIcon: function(markerColor) {
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
    };

})();
