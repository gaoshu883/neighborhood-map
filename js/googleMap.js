// 全局变量
var app = app || {};

(function() {

    app.googleMap = {
        map: {},
        markers: [],
        currentLocation: null, // 点击marker选中某地点
        currentMarker: null, // 缓存被选中的marker(直接点击marker；点击地点列表)
        activatedMarker: false, // 表明marker状态
        bounds: null, // 存储初始渲染的地图边界范围
        largeInfoWindow: null, // 存储信息窗口对象
        isMobile: false, // 当前是否为移动版
        listenerIDs:[], // 缓存所有通过google.maps.event.addListener添加的监听程序id
        // 异步请求google地图后的回调函数
        initMap: function() {
            'use strict';

            var self = this;

            // 初始化地图
            this.map = new google.maps.Map(document.getElementById('map'), {
                // 以中国的地理中心点为中心
                center: new google.maps.LatLng(34.53,108.92),
                scrollwheel: true,
                zoom: 4
            });

            // 判断使用的是否为移动设备
            // 横屏：电脑
            // 竖屏：移动端
            self.isMobile = window.innerHeight > window.innerWidth ? true : false;
            // 当用户更改了设备方向
            // 重新判断设备类型
            window.addEventListener('resize',
                function() {
                    self.isMobile = window.innerHeight > window.innerWidth ? true : false;
                }, false);

        },
        // 功能：创建所有sights地点markers
        // 触发条件：
        // 1. app首次渲染
        // 2. 用户更新city
        // 注意：
        // 1. markers重置
        // 2. largeInfoWindow重置
        // 3. bounds重置
        createMarkers: function() {
            var self = this;
            // 初始化信息窗口 // 重写
            this.largeInfoWindow = new google.maps.InfoWindow();

            // 地图边界默认无
            this.bounds = null;

            // 自定义markers的样式
            var defaultIcon = this.makeMarkerIcon('268bd2');

            // 当用户鼠标经过某个marker的时候，该marker高亮显示
            var highlightedIcon = this.makeMarkerIcon('ffff24');

            // 遍历全部地点，然后为每个地点创建一个marker
            // 暂未设置到地图上
            var _locations = app.listViewModel.locationList();

            for (var i = 0; i < _locations.length; i++) {
                var markerOptions = {
                        position: _locations[i].geoLocation,
                        address: _locations[i].address[0] || '',
                        category: _locations[i].category || '',
                        title: _locations[i].name,
                        icon: defaultIcon, // image
                        animation: google.maps.Animation.DROP,
                        id: _locations[i].id
                };
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
                // 6. marker为激活状态
                // 5. 高亮marker （显式，需要关闭）
                // 3. 显示信息窗口 （显式，需要关闭）
                // 4. 显示地点详情 （显式，需要关闭）
                var listenerID1 = google.maps.event.addListener(marker, 'click', function() {
                    // 1. 设置当前地点
                    self.currentLocation = _locations[this.id];
                    // 2. 将当前marker设置为目标
                    self.currentMarker = this;
                    // 3. 显示marker信息
                    self.showMarkerInfo(this, self.largeInfoWindow);
                    // 4. 显示地点详情
                    // 移动端不显示
                    if (!self.isMobile) {
                        self.showDetails();
                    }
                });
                // 为每一个marker注册两个鼠标事件监听程序
                // 电脑端有效
                listenerID2 = google.maps.event.addListener(marker, 'mouseover', function() {
                    this.setIcon(highlightedIcon);
                });
                listenerID3 = google.maps.event.addListener(marker, 'mouseout', function() {
                    this.setIcon(defaultIcon);
                });
                this.listenerIDs.push(listenerID1,listenerID2,listenerID3);
            }
        },
        // 函数：显示满足筛选条件的markers
        // 实现：
        // 1. 首次渲染marker
        // 2. 根据locationList确定地图边界，无特殊情况，边界不重复渲染
        // 3. 用户筛选后：
        //               重新渲染markers
        // 此部分和信息窗口 marker颜色无关
        showMarkers: function() {
            //
            if (!this.bounds) {
                // 初始化地图边界
                this.bounds = new google.maps.LatLngBounds();
                for (var i = 0, len = this.markers.length; i < len; i++) {
                    // 把每一个标记纳入边界内
                    this.bounds.extend(this.markers[i].position);
                }
                // 让地图适应边界显示
                this.map.fitBounds(this.bounds);
            }

            // 满足筛选条件的地点
            var _locations = app.listViewModel.filterLocations();

            // 根据地点id过滤markers
            var _markers = this.markers.filter(function(val) {
                return _locations.some(function(ele) {
                    return ele.id == val.id;
                });
            });

            var _len = _markers.length;
            if (_len === 0) {
                return;
            } else {
                for (var j = 0; j < _len; j++) {
                    // 指定marker渲染所在地图
                    _markers[j].setMap(this.map);
                    // 每个marker显示一个编号
                    _markers[j].setLabel({
                        fontSize: '12',
                        text: (j + 1).toString()
                    });
                }
            }
        },
        // 用户点击列表地点时触发
        // 1. 高亮显示marker
        // 2. 显示信息窗口
        // 3. marker设置为被选中
        // 这里仅有event handler
        // 在list - view model 中监听调用
        toggleMarker: function(id) {
            // 防止用户重复点击同一地点
            // this.markers[id]    本次点击的marker
            // this.currentMarker   前一次点击的marker 或者为null
            // 判断是否为同一次
            if (this.markers[id] !== this.currentMarker) {
                // 不是同一次
                // 将当前点击的marker设置为目标marker
                this.currentMarker = this.markers[id];
                // 显示marker信息
                this.showMarkerInfo(this.currentMarker, this.largeInfoWindow);
            } else if (!this.activatedMarker) {
                // 是同一marker，但是前一次marker被关闭，需要重新激活
                // 显示marker信息
                this.showMarkerInfo(this.currentMarker, this.largeInfoWindow);
            }
        },
        // 点击marker时
        // 1. 显示信息窗口
        // 2. 高亮marker
        // 3. 设置为激活marker状态
        showMarkerInfo: function(marker, infoWindow) {
            var self = this;

            // 先检查一下当前marker是否已经有窗口打开
            // 没有打开，才打开
            // infoWindow.marker    前一个marker || undefined
            // marker    当前marker
            if (infoWindow.marker !== marker) {
                // 如果当前存在激活状态的marker
                // 则把marker恢复为默认颜色
                if (this.activatedMarker) {
                    infoWindow.marker.setIcon(self.makeMarkerIcon('268bd2'));

                }

                infoWindow.marker = marker;

                // marker设置为激活状态
                this.activatedMarker = true;
                // 高亮显示marker
                marker.setIcon(this.makeMarkerIcon('ffff24'));

                infoWindow.setOptions({
                    content: '<div id="infoWindow"><div>' + marker.title + '</div>' +
                        '<div class="infoWindow-category">' + marker.category + '</div>' +
                        '<div class="infoWindow-address">' + marker.address + '</div>' +
                        '<div class="details-link"><a title="For more details about this place" href="#" onclick="javascript:app.googleMap.showDetails(this)">Location details</a></div></div>',
                    maxWidth: 250
                });
                // 动态加载脚本
                // http://stackoverflow.com/questions/574944/how-to-load-up-css-files-using-javascript
                // 位置很重要，必须在open之前
                var cssId = 'infoWindow';  // you could encode the css path itself to generate id..
                if (!document.getElementById(cssId))
                {
                    console.log('我被创建了，成功');
                    var head  = document.getElementsByTagName('head')[0];
                    var link  = document.createElement('link');
                    link.id   = cssId;
                    link.rel  = 'stylesheet';
                    link.type = 'text/css';
                    link.href = 'style/infoWindow.css';
                    head.appendChild(link);
                }

                var listenerID4 = google.maps.event.addListener(infoWindow, 'closeclick', function() {
                    // 调用方法
                    self.hideMarkerInfo(marker, infoWindow);
                });
                this.listenerIDs.push(listenerID4);
            }

            infoWindow.open(app.googleMap.map, marker);
        },
        // 用户关闭信息窗口 || 数据重新载入时，隐藏marker信息
        // 参数：
        // marker：当前marker
        // infoWindow:当前信息窗口
        hideMarkerInfo: function(marker, infoWindow) {
            // 关闭信息窗口
            // marker恢复默认颜色
            // marker设置为未激活状态
            marker.setIcon(this.makeMarkerIcon('268bd2'));
            infoWindow.close();
            this.activatedMarker = false;
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
        // 重置地图所有状态（属性）
        // 隐藏所有markers
        resetMap: function() {
            // 1. 重置marker信息
            if (this.currentMarker) {
                if (this.activatedMarker) {
                    this.hideMarkerInfo(this.currentMarker, this.largeInfoWindow);
                }
                // 2. 重置currentMarker
                this.currentMarker = null;
            }
            // 3. currentLocation恢复无
            this.currentLocation = null;
            // 所有标记均不显示
            if (this.markers.length!==0) {
                this.markers.forEach(function(item) {
                    item.setMap(null);
                });
            }
        },
        showDetails: function(ele) {
            // console.log(typeof ele);
            app.listViewModel.showDetails(this.currentLocation);
            app.listViewModel.whoTriggerDetails = ele;
        }
    };

})();
