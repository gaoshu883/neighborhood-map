// 在数组上添加fuzzy method
// http://stackoverflow.com/questions/9206013/javascript-fuzzy-search
// 在原答案上进行了升级改造
// 允许用户输入带空格的短语
// 只要有一个单词满足筛选条件，则返回true
// 字符串中带空格
// 默认为或的关系
String.prototype.fuzzy = function(s) {
  // 得到一组字符串 用户输入
  // 过滤到空字符串数组元素
  // 过滤的方法来源：http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
    var sArr = s.split(' ').filter(Boolean);
    var hay = this.toLowerCase(), // 库中的字符串
        i = 0,
        pos = -1,
        l;
    // itemStr为用户输入的每一个字符串
    // 只要字符串数组中有一个item满足筛选则返回true
    // satisfyFilter是boolean类型
    var satisfyFilter = sArr.some(function(itemStr) {
        itemStr = itemStr.toLowerCase();
        for (; l = itemStr[i++];) {
            if (!~(pos = hay.indexOf(l, pos + 1))) {
                return false;
            }
        }
        return true;
    });

    return satisfyFilter;
};