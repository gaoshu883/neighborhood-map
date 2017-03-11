// 全局变量
var app = app || {};

// 形成local scope
// 在该scope使用严格模式
(function() {
    'use strict';

    var ListViewModel = function() {
        // this别名
        // 指代listViewModel对象
        var self = this;

        // 监控地点数组
        // 初始值为undefined
        self.locationList = ko.observableArray();
        // 媒介
        // 缓存用户输入的filter字符串
        // 当点击搜索按钮，将字符串传递给currentFilter().name
        self.tempFilterName = ko.observable();
        // 筛选条件为对象类型
        // name属性：存储筛选字符串
        // id属性：如果当前为类别筛选，则为筛选出来的地点的id数组
        // property to store the filter
        self.currentFilter = ko.observable({
            name: ko.observable(),
            id: ko.observableArray()
        });

        // 筛选地点算法
        // 实现地点筛选
        // 返回筛选出的地点数组
        self.filterLocations = ko.computed(function() {
            // 若用户输入内容
            // 将用户输入的内容转换成字符串数组
            // 并排除所有的空字符串 filter
            // name初始值为undefined, falsy
            // 数组类型为true
            if (!self.currentFilter().name() || self.currentFilter().name().split(' ').filter(Boolean).length === 0) {
                // there is no filter string
                return self.locationList();
            } else if (!(self.currentFilter().id().length === 0)) {
                // 筛选1：点击类别名称进行筛选
                // 每个类别下对应不同的地点，以id存储
                // 所以可以直接按id进行检索筛选
                var _tempArr = [];
                self.currentFilter().id().forEach(function(item) {
                    _tempArr.push(self.locationList()[item]);
                });
                // 进行过类别筛选，就把id重置为[]
                // 清空筛选ID数组
                self.currentFilter().id([]);

                return _tempArr;
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
                    var _tempArr = (item.name.split(' ').concat(item.category.split(' '))).filter(Boolean);
                    return _tempArr.some(function(prop) {
                        return prop.fuzzy(self.currentFilter().name());
                    });
                });
            }
        });


        // 设置筛选条件 => 立即筛选出地点
        // 直接数据筛选1 和类型筛选2 均通过这里设置
        // list details 重置
        // map 重置
        self.setCurrentFilter = function(data) {
            if (!!data) {
                // 避免重复搜索
                if (data.id && data.name !== self.currentFilter().name()) {
                    // 确定为类型筛选，且筛选词发生改变
                    self.currentFilter().name(data.name);
                    self.currentFilter().id(data.id);
                    // 显示在filter搜索框中
                    self.tempFilterName(data.name);
                } else if (!data.id && self.tempFilterName() !== self.currentFilter().name()) {
                    // 确定为直接输入筛选，且筛选词不重复
                    self.currentFilter().name(self.tempFilterName());
                    self.currentFilter().id([]);
                }
            }
        };

        // 搜索框
        //
        self.searchBoxSelected = ko.observable(false);
        self.setSearchFocused = function() {
            self.searchBoxSelected(true);
            self.filterStatus(false);
        }
        self.cityName = ko.observable('');

        self.cityNameChanged = ko.observable(false);

        self.changeCityName = function() {
            self.cityNameChanged(true);
        };
        // 当用户点击搜索按钮
        // 首先设置当前搜索条件 => 地点随之会发生变动
        // 同时关闭搜索框
        // 当city box中的地点发生了更改才发送ajax请求
        // 否则进行类别筛选
        self.fetchLocations = function(data) {
            // 两者均改变
            if (self.cityNameChanged()&&self.tempFilterName()!==self.currentFilter().name()) {
                self.listPretendInvisible(true);
            }

            self.setCurrentFilter(data);
            // fetch数据后，就能筛选地点
            if (self.cityNameChanged()) {
                self.cityNameChanged(false);
                app.fetchLocations();
                console.log('City Name 发生了改变');
            } else {
                console.log('无需ajax，直接筛选');

                // list details重置
                self.resetListDetails();
                // map重置
                app.googleMap.resetMap();
                // 显示筛选后markers
                app.googleMap.showMarkers();

            }
            // 阻止a tag link默认事件
            return false;
        };

        // 当用户按下enter键时调用fetchLocations方法
        self.enterKeyUp = function(data,event) {
            if (event.keyCode === 13) {
                self.fetchLocations(data);
            }
        }
        // 为了解决filter condition和city name同时change时出现的bug
        // 特别使用的一个变量
        // 当上述两者只其一发生改变，变量为false 列表显示
        // 当上述两者均改变，变量为true 列表不显示
        self.listPretendInvisible = ko.observable(false);

        // 缓存所有的类别
        // 一组类别对象
        // 对象属性：
        //          name     string
        //          id       array of number
        // 可监控变量，因为新的数据fetch之后，数据自然需要更新
        self.categoryList = ko.computed(function() {
            var _list = [];
            this.locationList().forEach(function(item) {
              var _tempArr = [];
              // 新建对象的时候就给出限制
              // 当列表中已经存在这个类别，则返回true
              // 如果不存在则返回false
              var _itemIsExist = false;

              _itemIsExist = _list.some(function(ele) {
                _tempArr.push(ele);
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
                _list[_tempArr.length - 1].id.push(item.id);
              }
            });
            return _list;
        },this);

        self.filterStatus = ko.observable(false);

        self.toggleFilter = function() {
            if (self.filterStatus()) {
                self.filterStatus(false)
            } else {
                self.filterStatus(true);
                self.searchBoxSelected(false);
            }
            // 阻止a tag link默认事件
            return false;
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
            // 必须保证deteails、see-in-map filter searchbox状态不显示
            // 关闭筛选框
            self.filterStatus(false);
            // 关闭搜索框
            self.searchBoxSelected(false);
            self.detailsStatus(false);
            self.mapStatus(false);

            // 根据list当前状态进行切换
            this.listStatus() ? self.listStatus(false) : this.listStatus(true);

            // 阻止a tag link 默认事件的发生
            return false;
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
            // 重置map list filter searchbox状态为false
            self.mapStatus(false);
            self.listStatus(false);
            self.filterStatus(false);
            self.searchBoxSelected(false);
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

            // 阻止a tag link 默认事件的发生
            return false;
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
        // 重置list和details所有状态（属性）
        self.resetListDetails = function() {
            // 关闭筛选框
            self.filterStatus(false);
            // 关闭搜索框
            self.searchBoxSelected(false);
            // 2.
            self.detailsStatus(false);
            self.mapStatus(false);
            // 1.
            self.listStatus(true);
            //
            self.currentLocation(null);
            //
            self.cityNameChanged(false);

            self.listPretendInvisible(false);//
        };

    };

    // 在map之前创建列表
    app.listViewModel = new ListViewModel();

})();
