// 全局变量
var app = app || {};

(function() {

    app.googleMap = {
        map: {},
        markers: [],
        currentLocation: null, // 点击marker选中某地点
        selectedMarker: null, // 缓存被选中的marker(直接点击marker；点击地点列表)
        bounds: null, // 存储初始渲染的地图边界范围
        largeInfoWindow: null, // 存储信息窗口对象
        isMobile: false, // 当前是否为移动版
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

            // 判断使用的是否为移动设备
            self.isMobile = window.innerHeight > window.innerWidth ? true : false;
            // 当用户更改了设备方向
            window.addEventListener('resize',
                function() {
                    self.isMobile = window.innerHeight > window.innerWidth ? true : false;
                }, false);

            console.log(self.isMobile);

            // 监听搜索框的change事件
            // 重置状态
            // 更新标记
            document.getElementById('searchBox').addEventListener('change', function() {
                // 重置状态：关闭信息窗口 恢复默认颜色
                console.log('我监听到change事件');
                if (self.selectedMarker) {
                    if (self.largeInfoWindow && self.largeInfoWindow.getMap()) {
                        self.largeInfoWindow.close();
                    }
                    self.selectedMarker.setIcon(self.makeMarkerIcon('268bd2'));
                }
                self.showMarkers();
            });

        },
        // 功能：创建markers
        // 1. 当city更新后创建所有sights地点markers
        // 2.
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
                        category: _locations[i].category || '',
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

                // 用户交互键
                // 点击marker
                // 实现：
                // 1. 设置当前地点（隐式，无需关闭）
                // 2. 将当前marker设置为目标 （隐式，无需关闭）
                // 5. 高亮marker （显式，需要关闭）
                // 3. 显示信息窗口 （显式，需要关闭）
                // 4. 显示地点详情 （显式，需要关闭）
                marker.addListener('click', function() {
                    // 1. 设置当前地点
                    self.currentLocation = _locations[this.id];
                    // 2. 将当前marker设置为目标
                    self.selectedMarker = this;
                    // 3. 显示信息窗口
                    self.showInfoWindow(this, self.largeInfoWindow);
                    // 4. 显示地点详情
                    // 移动端不显示
                    if (!self.isMobile) {
                        self.showDetails();
                    }
                    // 5. 高亮marker
                    self.selectedMarker.setIcon(highlightedIcon);

                });
                // 为每一个marker注册两个鼠标事件监听程序
                // 电脑端有效
                marker.addListener('mouseover', function() {
                    this.setIcon(highlightedIcon);
                });
                marker.addListener('mouseout', function() {
                    this.setIcon(defaultIcon);
                })
            }
        },
        // 函数：`渲染`所有markers
        // 实现：
        // 1. 首次渲染marker
        // 2. 确定地图边界，无特殊情况，边界不重复渲染
        // 3. 用户筛选后，重新渲染marker
        showMarkers: function() {
            // 只有当值为null falsy
            // 存储边界对象后  trusy
            if (!this.bounds) {
                // 初始化地图边界
                this.bounds = new google.maps.LatLngBounds();
            }
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

            // 根据地点id过滤markers
            _markers = _markers.filter(function(val) {
                return _locations.some(function(ele) {
                    return ele.id == val.id;
                });
            });

            var len = _markers.length;
            if (len === 0) {
                return;
            } else {
                for (var i = 0; i < len; i++) {
                    // 指定marker渲染所在地图
                    _markers[i].setMap(_map);
                    // 每个marker显示一个编号
                    _markers[i].setLabel({
                        fontSize: '12',
                        text: (i + 1).toString()
                    });
                }
                if (this.bounds.isEmpty()) {
                    for (var i = 0; i < len; i++) {
                        // 把每一个标记纳入边界内
                        this.bounds.extend(_markers[i].position);
                        // 让地图适应边界显示
                        _map.fitBounds(this.bounds);
                        // console.log(this.bounds);
                    }
                }
            }
        },
        // 功能：当用户点击列表中的地点时，高亮显示对象的marker，map中心切换
        // 这里仅有event handler
        // 在list - view model 中监听调用
        toggleMarker: function(id) {
            // 先判断当前marker是否前一次刚点击过
            // 没有点击过，才点击
            if (this.selectedMarker !== this.markers[id]) {
                // 用户选中的地点marker
                // 保证一次只会选中一个地点
                this.selectedMarker = this.markers[id];
                // 高亮显示marker
                this.selectedMarker.setIcon(this.makeMarkerIcon('ffff24'));
                // 显示信息窗口
                this.showInfoWindow(this.selectedMarker, this.largeInfoWindow);
            } else if (!this.largeInfoWindow.getMap()) {
                // 高亮显示marker
                this.selectedMarker.setIcon(this.makeMarkerIcon('ffff24'));
                // 显示信息窗口
                this.showInfoWindow(this.selectedMarker, this.largeInfoWindow);
            }
        },
        // 点击marker时，显示信息窗口
        showInfoWindow: function(marker, infoWindow) {
            var self = this;
            // 先检查一下当前marker是否已经有窗口打开
            // 没有打开，才打开
            if (infoWindow.marker !== marker) {
                // 切换到下一个marker之前，先把上一个marker恢复为默认
                if (infoWindow.marker) {
                    infoWindow.marker.setIcon(self.makeMarkerIcon('268bd2'));
                }
                infoWindow.marker = marker;
                infoWindow.setOptions({
                    content: '<div style="font:16px/1.5 sans-serif"><div>' + marker.title + '</div>' +
                        '<div style="font-size:12px;color:#ff7f27">' + marker.category + '</div>' +
                        '<div style="font-size:12px">' + marker.address + '</div>' +
                        '<div id="infoWindow" style="font-weight: bold;cursor:pointer;color:#268bd2" onclick="app.googleMap.showDetails(this)">Location details</div></div>',
                    maxWidth: 250
                });
                google.maps.event.addListener(infoWindow, 'closeclick', function() {
                    // console.log('我被关闭了');
                    // 关闭信息窗口
                    // marker恢复默认颜色
                    // console.log(marker);
                    marker.setIcon(self.makeMarkerIcon('268bd2'));
                    infoWindow.close();
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
        },
        showDetails: function(ele) {
            // console.log(typeof ele);
            app.viewModel.showDetails(this.currentLocation);
            app.viewModel.whoTriggerDetails = ele;
        }
    };

})();
