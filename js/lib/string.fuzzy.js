// 在数组上添加fuzzy method
// http://stackoverflow.com/questions/9206013/javascript-fuzzy-search
// 应该避免在原型上添加方法
// 没能理解这个算法的含义
String.prototype.fuzzy = function (s) {
    var hay = this.toLowerCase(), i = 0, n = -1, l;
    s = s.toLowerCase();
    for (; l = s[i++] ;) if (!~(n = hay.indexOf(l, n + 1))) return false;
    return true;
};