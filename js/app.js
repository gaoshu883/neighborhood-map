// 全局变量
var app = app || {};

// 最后绑定数据
ko.applyBindings(app.listViewModel);

// 输入默认搜索城市名
app.listViewModel.cityName('New York');

// 获取地点数据
app.fetchLocations();




