// 全局变量
var app = app || {};

// 形成local scope
// 在该scope使用严格模式
(function() {
    'use strict';

    app.ViewModel = function() {
        // this别名
        // 指代viewModel对象
        var self = this;

        // 监控地点数组
        self.locationList = ko.observableArray();
        // 缓存并监控过滤条件变量
        // property to store the filter
        self.currentFilter = ko.observable({
            name: ko.observable(),
            id: ko.observableArray()
        });

        // 筛选地点
        self.filterLocations = ko.computed(function() {
            // 若用户输入内容
            // 将用户输入的内容转换成字符串数组
            // 并排除所有的空字符串
            // name初始值为了undefined, falsy
            // 数组类型的boolean始终为true
            if (!self.currentFilter().name() || self.currentFilter().name().split(' ').filter(Boolean).length === 0) {
                // there is no filter string
                return self.locationList();
            } else if (self.currentFilter().id() == true) {
                // 筛选1：点击类别名称进行筛选
                // 每个类别下对应不同的地点，以id存储
                // 所以可以直接按id进行检索筛选
                var _temArr = [];
                self.currentFilter().id().forEach(function(item) {
                    _temArr.push(self.locationList()[item]);
                });
                return _temArr;
            } else {
                // 筛选2：直接输入筛选
                // 使用了ko提供的数组筛选方法，类似ES5 的filter方法
                // http://stackoverflow.com/questions/20857594/knockout-filtering-on-observable-array
                // 筛选条件判断为true 则返回对应的location item
                return ko.utils.arrayFilter(self.locationList(), function(item) {
                    // debugger;
                    // 使用模糊搜索算法 `fuzzy`
                    // 将用户输入的字符串与地点的名称和类别进行比对筛选
                    // 为了提高匹配准确度，把地点名称和类别字符串全部拆分
                    // 并合并为一个字符串数组，同时排除掉空字符串
                    // 只要用户输入的字符串数组中有一个元素
                    // 与地点字符串数组中的一个元素匹配上，则返回true
                    var _temArr = (item.name.split(' ').concat(item.category.split(' '))).filter(Boolean);
                    return _temArr.some(function(prop) {
                        return prop.fuzzy(self.currentFilter().name());
                    });
                });
            }
        });

        // 设置当前筛选条件
        self.setCurrentFilter = function(data) {
            self.currentFilter().name(data.name);
            self.currentFilter().id(data.id);

            // 重置状态
            self.filterStatus(false);

            self.detailsStatus(false);
            self.mapStatus(false);
            self.listStatus(true);

            // 重新渲染地图
            app.googleMap.showMarkers();
        };
        // 缓存所有的类别
        // 一组类别对象
        // 对象属性：
        //          name     string
        //          id       array of number
        // 可监控变量，因为新的数据fetch之后，数据自然需要更新
        self.categoryList = ko.computed(function() {
            var _list = [];
            this.locationList().forEach(function(item) {
              var _temArr = [];
              // 新建对象的时候就给出限制
              // 当列表中已经存在这个类别，则返回true
              // 如果不存在则返回false
              var _itemIsExist = false;

              _itemIsExist = _list.some(function(ele) {
                _temArr.push(ele);
                return ele.name === item.category;
              });

              // 如果不存在，则新建对象
              // 如果存在，就把item.id直接push到原对象的id中
              if (!_itemIsExist) {
                _list.push({
                name: item.category,  // string || null
                id: [item.id]     // array of number
              })
              } else {
                _list[_temArr.length - 1].id.push(item.id);
              }
            });
            return _list;
        },this);

        self.filterStatus = ko.observable(false);

        self.toggleFilter = function() {
            self.filterStatus() ? self.filterStatus(false): self.filterStatus(true);
        };

        // 列表栏状态
        // 默认为开启状态
        self.listStatus = ko.observable(true);
        // 若列表栏设置为开启，则滑出列表；否则滑走列表
        self.listCSS = ko.computed(function() {
            return self.listStatus() ? 'search-show' : 'search-hide';
        });
        // 切换1：切换列表状态
        // 此toggle list切换只限于list移出和移入
        // 函数体中必须为`this`，改为`self`会出错
        self.toggleList = function() {
            // 重置details map状态
            // 必须保证deteails、see-in-map状态不显示
            self.detailsStatus(false);
            self.mapStatus(false);
            // 根据list当前状态进行切换
            this.listStatus() ? self.listStatus(false) : this.listStatus(true);
        };


        // 缓存被用户单击的地点
        self.currentLocation = ko.observable();

        // 如果从4sq获取的图片无法使用，则使用该占位图片
        self.imageHolder = "http://lorempixel.com/500/300";

        // 地点详情窗口状态
        // 默认为关闭状态
        self.detailsStatus = ko.observable(false);
        // 是谁触发详情窗口的开启
        self.whoTriggerDetails = null;

        // 切换2：show location details panel
        // 移动端、电脑端均可实现
        // 实现：设置当前地点
        //       显示信息窗口
        //       显示地点详情
        self.showDetails = function(data) {
            // console.table(data);
            // console.log(obj);
            // console.log(data !== self.currentLocation());
            // 2. 显示地点详情
            self.detailsStatus(true);
            // 重置map list状态为false
            self.mapStatus(false);
            self.listStatus(false);
            // 传进来的数据就是当前地点对象
            // 先判断当前地点是否已经显示
            // 未显示，则显示
            if (data !== self.currentLocation()) {
                // 1. 设置当前地点
                self.currentLocation(data);
                app.googleMap.currentLocation = data;
            }
            // 当前地点的ID为data.id
            // 3. 显示信息窗口
            app.googleMap.toggleMarker(data.id);

            // 把data传递给hideDetails
            self.whoTriggerDetails = data;
            // console.log(data);
        };
        // 切换3：hide location details panel
        // 实现后退功能
        // 仅移动端实现
        self.hideDetails = function() {
            // 重置map list状态为false
            // self.mapStatus(false);
            if (Object.prototype.toString.call(self.whoTriggerDetails) === '[object Object]') {
                self.listStatus(true);
            }

            self.detailsStatus(false);
        };

        // map默认不显示
        self.mapStatus = ko.observable(false);
        // 切换为map
        // 切换4：仅移动端 实现map显示
        self.showMap = function() {
            // 保证list和details都不存在
            self.mapStatus(true);
        };

        // 根据不用的显示，切换菜单文本
        self.toggleMenuText = ko.computed(function() {
            if (!self.mapStatus() && self.listStatus()) {
                return 'Map';
            } else {
                return 'List';
            }
        });

    };

    // 在map之前创建列表
    app.viewModel = new app.ViewModel();

})();
