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
    self.locationList = ko.observableArray(locations);
    // 缓存并监控过滤条件变量
    // property to store the filter
    self.currentFilter = ko.observable();

    // 过滤地点数组
    // http://stackoverflow.com/questions/20857594/knockout-filtering-on-observable-array
    self.filterLocations = ko.computed(function() {
        if(!self.currentFilter()) {
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

    // 地址搜索栏状态
    // 默认为未关闭状态
    self.sideBarStatus = ko.observable(false);

    self.searchSideBar = ko.computed(function() {
      return self.sideBarStatus() ? 'search-hide': 'search-show';
    });

    // 缓存被用户单击的地点
    self.currentLocation = ko.observable();

    // 显示当前选中地点的详情信息
    // 如何实现：单击同一对象：关闭；单击另一对象：再次设置
    self.showDetails = function() {
      self.currentLocation(this);
      self.detailsStatus(true);

      // 实现：用户单击列表中的地点，相应的地点marker高亮
      app.googleMap.toggleMarker();
    };

    // 隐藏地点详情信息窗口
    self.hideDetails = function() {
      self.currentLocation(null);
      self.detailsStatus(false);
      // 实现：用户取消详情窗口时，相应的地点marker恢复默认
      app.googleMap.toggleMarker();
    };

    // 切换地址搜索栏的开启状态
    // 函数体中必须为`this`，改为`self`会出错
    self.toggleSideBar = function() {
      this.sideBarStatus() ? this.sideBarStatus(false) : this.sideBarStatus(true);
    };
  };

  // 在map之前创建列表
  // 并绑定数据
  app.viewModel = new app.ViewModel();
  ko.applyBindings(app.viewModel);

})();
