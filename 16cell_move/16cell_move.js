/**
 * Created by louyq on 2017/7/18.
 */
var _ = (function () {//功能函数
    function extend(o1, o2) {
        for (var i in o2) {
            if (o1[i] === undefined) {
                o1[i] = o2[i];
            }
        }
    }

    function html2node(tpl) {
        var div = document.createElement('div');
        div.innerHTML = tpl;
        return div.children[0];
    }

    function getElement(expression, node) {
        node = node || document;
        var retNode = null;
        (~expression.indexOf('.')) && (retNode = node.getElementsByClassName(expression.substring(1)));
        (~expression.indexOf('#')) && (retNode = node.getElementById(expression.substring(1)));
        if (retNode) {
            return retNode;
        }
        return node.getElementsByTagName(expression);
    }

    function getStyle(node, prop, isToNumber) {
        var value = window.getComputedStyle(node).getPropertyValue(prop);
        return isToNumber ? parseInt(value) : value;
    }

    function addClass(node, className) {
        var oldClassName = node.className;
        var newClassName = '';
        newClassName = (oldClassName === '' ? className : (oldClassName + ' ' + className));
        newClassName = newClassName.replace(/\s+/g, ' ');
        node.className = newClassName;
    }

    function removeClass(node, className) {
        var oldClassName = node.className;
        var Reg = new RegExp(' ' + className + ' ');
        var newClassName = (' ' + oldClassName + ' ').replace(Reg, ' ');
        node.className = newClassName.replace(/\s+/g, ' ');//删除多余空格
    }

    function hasClass(node, className) {
        if(!node)return;
        var obj_class = node.className;//获取 class 内容.
        var obj_class_lst = obj_class.split(/\s+/);//通过split空字符将cls转换成数组.

        for (var x in obj_class_lst) {
            if (obj_class_lst[x] == className) {//循环数组, 判断是否包含cls
                return true;
            }
        }
        return false;
    }

    function getClassNum(node, className) {
        var oldClassName = ' ' + node.className + ' ';
        var Reg = new RegExp(' ' + className + '([0-9]{1}) ');//正则匹配
        Reg.test(oldClassName);
        return RegExp.$1;
    }

    return {
        extend: extend,
        h2n: html2node,
        $: getElement,
        getStyle: getStyle,
        addClass: addClass,
        removeClass: removeClass,
        getClassNum: getClassNum,
        hasClass: hasClass,
    }
})()

function CellMove(options) {
    options = options || {};
    this.itemText = [['A', 1, 2, 3], ['B', 4, 5, 6], ['C', 7, 8, 9], ['D', 10, 11, 12]];
    this.prefix = ['js-row-', 'js-col-'];
    this.mouseHold = false;
    this.holdNode = null;
    var defaultOptions = {
        template: "<div class='movable-item'></div>",
        el: '.cell-container'
    }
    _.extend(options, defaultOptions);
    this.options = options;
    this._containerHeight = 0;
    this._containerWidth = 0;
    this._itemHeight = 0;
    this._itemWidth = 0;
    this._layout = null;//容器的node
    this._oldPos = {x: 0, y: 0};
    this._init();
}
_.extend(CellMove.prototype, {
    _init: function () {
        this._initLayout();
        this._initEvent();
    },
    _initLayout: function () {
        this._layout = _.$(this.options.el)[0];
        //获取容器宽高并计算出item的宽高
        this._containerHeight = _.getStyle(this._layout, 'height', true);
        this._containerWidth = _.getStyle(this._layout, 'width', true);
        this._itemHeight = this._containerHeight / 4;
        this._itemWidth = this._containerWidth / 4;
        var itemLayout = _.h2n(this.options.template);
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {//i=col j=row
                //克隆item的node并且设置宽高和初始的类
                var _itemLayout = itemLayout.cloneNode(true);
                _.addClass(_itemLayout, this.prefix[1] + i);
                _.addClass(_itemLayout, this.prefix[0] + j);
                _.addClass(_itemLayout, 'tran-move');
                if (j === 0) {
                    _.addClass(_itemLayout, 'special');//设置第一行元素为special元素
                }
                _itemLayout.style.width = this._itemWidth + 'px';
                _itemLayout.style.height = this._itemHeight + 'px';
                _itemLayout.style.lineHeight = this._itemHeight + 'px';
                _itemLayout.style.backgroundColor='#fff';
                _itemLayout.style.zIndex='1';
                _itemLayout.innerText = this.itemText[i][j];
                this._layout.appendChild(_itemLayout);
            }
        }
        this._reOrder();
    },
    _initEvent: function () {
        var that = this;
        this._layout.addEventListener('mousedown', function (e) {
            if ((!that.mouseHold) && (~e.target.className.indexOf('movable-item'))) {//按下的node是否有movable-item这个类
                e.preventDefault();
                that._oldPos.x = e.clientX - e.target.offsetLeft;
                that._oldPos.y = e.clientY - e.target.offsetTop;
                that.mouseHold = true;
                that.holdNode = e.target;//获取移动的node 防止移动时e.target改变而出错
                that.holdNode.style.zIndex='99';
                that.holdNode.style.borderColor='red';
                _.removeClass(that.holdNode,'tran-move');
            }
        });
        var topMax=this._containerHeight-this._itemHeight;
        var leftMax=this._containerWidth-this._itemWidth;
        this._layout.addEventListener('mousemove', function (e) {
            if (!that.mouseHold) {
                return;
            }
            var holdNodeLeft=e.clientX - that._oldPos.x;
            var holdNodeTop=e.clientY - that._oldPos.y;
            //限制移动
            (holdNodeLeft<0)&&(holdNodeLeft=0);
            (holdNodeTop<0)&&(holdNodeTop=0);
            (holdNodeTop>topMax)&&(holdNodeTop=topMax);
            (holdNodeLeft>leftMax)&&(holdNodeLeft=leftMax);

            that.holdNode.style.left = holdNodeLeft  + 'px';
            that.holdNode.style.top = holdNodeTop + 'px';//跟随鼠标移动
            var sourceRow = _.getClassNum(that.holdNode, 'js-row-');
            var sourceCol = _.getClassNum(that.holdNode, 'js-col-');
            //获取目标元素位置
            var dstRow = Math.ceil((_.getStyle(that.holdNode, 'top', true) + e.offsetY) / that._itemHeight) - 1;
            var dstCol = Math.ceil((_.getStyle(that.holdNode, 'left', true) + e.offsetX) / that._itemWidth) - 1;
            var sourceSpecial = _.hasClass(that.holdNode, 'special');

            //获取目标元素
            var dstNode = document.querySelector('.js-row-' + dstRow + '.js-col-' + dstCol);
            var dstSpecial = _.hasClass(dstNode, 'special');
            // console.log(dstRow,dstCol,sourceCol,sourceRow)
            var shouldReOrder=true;
            if((+dstRow!==+sourceRow||+dstCol!==+sourceCol)&&dstNode){//动态移动
                //两个特殊元素交换，则交换列
                (sourceSpecial && dstSpecial) && (that._moveColOrRow(sourceCol, dstCol, true));
                //源元素是特殊元素，目标元素是非特殊元素，且处在一行中
                (sourceSpecial && !dstSpecial && (+dstCol === (+sourceCol))) && (that._moveColOrRow(sourceRow, dstRow, false));
                //不处在一行中
                (sourceSpecial && !dstSpecial && (+dstCol !== (+sourceCol))) && (shouldReOrder=false);
                //两个非特殊元素
                (!sourceSpecial && !dstSpecial) && (that._moveCell(that.holdNode, dstNode));
                //源元素是非特殊元素，目标元素是特殊元素
                (!sourceSpecial && dstSpecial) && (shouldReOrder=false);
                // 重新规整
                if(shouldReOrder){
                    that._reOrder(true);
                }
            }
        })
        this._layout.addEventListener('mouseup', function (e) {
            _.addClass(that.holdNode,'tran-move');
            that._reOrder();
            that.holdNode.style.zIndex='1';
            that.mouseHold = false;
            that.holdNode = null;
        })
    },
    /**
     *
     * @param sourceNode
     * @param dstNode
     * @private
     */
    _moveCell: function (sourceNode, dstNode) {
        var dstRow = _.getClassNum(dstNode, 'js-row-');
        var dstCol = _.getClassNum(dstNode, 'js-col-');
        var sourceRow = _.getClassNum(sourceNode, 'js-row-');
        var sourceCol = _.getClassNum(sourceNode, 'js-col-');
        //col 和 row 调整
        _.addClass(sourceNode, 'js-col-' + dstCol);
        _.addClass(sourceNode, 'js-row-' + dstRow);
        _.removeClass(sourceNode, 'js-col-' + sourceCol);
        _.removeClass(sourceNode, 'js-row-' + sourceRow);

        _.addClass(dstNode, 'js-col-' + sourceCol);
        _.addClass(dstNode, 'js-row-' + sourceRow);
        _.removeClass(dstNode, 'js-col-' + dstCol);
        _.removeClass(dstNode, 'js-row-' + dstRow);
    },
    /**
     *
     * @param sourceRowOrCol 源列或行
     * @param dstRowOrCol 目标列或行
     * @param rowOrCol 列移动或行移动
     * @private
     */
    _moveColOrRow: function (sourceRowOrCol, dstRowOrCol, rowOrCol) {//false=row,true=col;
        // var rrc=+(Math.abs(ARow-relRow)>=Math.abs(ACol-relCol));//row or col
        var sourceClassName = this.prefix[+rowOrCol] + sourceRowOrCol;
        var dstClassName = this.prefix[+rowOrCol] + dstRowOrCol;
        var sourceList = document.querySelectorAll('.' + sourceClassName);
        var dstList = document.querySelectorAll('.' + dstClassName);
        // console.log(sourceClassName,dstClassName)
        for (var i in sourceList) {
            _.addClass(sourceList[i], dstClassName);
            _.removeClass(sourceList[i], sourceClassName);
        }
        for (var i in dstList) {
            _.addClass(dstList[i], sourceClassName);
            _.removeClass(dstList[i], dstClassName)
        }
    },
    _reOrder: function (noChangeColor) {//重新位置规整函数

        var node = null;
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                node = document.querySelector('.js-col-' + i + '.js-row-' + j);
                if(!noChangeColor){
                    node.style.borderColor='black';
                }
                node.style.top = this._itemHeight * j + 'px';
                node.style.left = this._itemWidth * i + 'px';
            }
        }

    }
});
