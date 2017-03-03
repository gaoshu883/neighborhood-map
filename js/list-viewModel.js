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
    self.currentFilter = ko.observable();

    // 过滤地点数组
    // http://stackoverflow.com/questions/20857594/knockout-filtering-on-observable-array
    self.filterLocations = ko.computed(function() {
        if(!self.currentFilter()) {
          // there is no filter string
            return self.locationList();
        } else {
          // debugger;
            return ko.utils.arrayFilter(self.locationList(), function(item) {
                // 模糊搜索算法 `fuzzy`
                return item.type.some(function(prop) {
                    return self.currentFilter().toLowerCase().fuzzy(prop.toLowerCase());
                  });
            });
        }
    });


    // 地点详情窗口状态
    // 默认为关闭状态
    self.detailsStatus = ko.observable(false);

    // 列表栏状态
    // 默认为开启状态
    self.listStatus = ko.observable(true);
    // 若列表栏设置为开启，则滑出列表；否则滑走列表
    self.locationsList = ko.computed(function() {
      return self.listStatus() ? 'search-show': 'search-hide';
    });

    // 缓存被用户单击的地点
    self.currentLocation = ko.observable();

    // 如果从4sq获取的图片无法使用，则使用该占位图片
    self.imageHolder = "http://lorempixel.com/500/300";

    // 显示详情信息，关闭列表，高亮marker
    self.showDetails = function() {
      self.currentLocation(this);
      self.detailsStatus(true);

      // 关闭列表
      // self.listStatus(false);

      // 高亮marker
      app.googleMap.toggleMarker();
    };

    // 隐藏地点详情信息窗口
    self.hideDetails = function() {
      self.currentLocation(null);
      self.detailsStatus(false);
      // 实现：用户取消详情窗口时，相应的地点marker恢复默认
      app.googleMap.toggleMarker();
    };

    // 切换列表状态
    // 函数体中必须为`this`，改为`self`会出错
    self.toggleList = function() {
      this.listStatus() ? this.listStatus(false) : this.listStatus(true);
    };
  };

  // 在map之前创建列表
  app.viewModel = new app.ViewModel();

})();
