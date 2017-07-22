/**
 * Created by louyq on 2017/7/18.
 */
var _=(function () {//功能函数
    function extend(o1,o2) {
        for(var i in o2){
            if(o1[i]===undefined){
                o1[i]=o2[i];
            }
        }
    }
    function html2node(tpl) {
        var div=document.createElement('div');
        div.innerHTML=tpl;
        return div.children[0];
    }
    function getElement(expression,node) {
        node=node||document;
        var retNode=null;
        (~expression.indexOf('.'))&&(retNode=node.getElementsByClassName(expression.substring(1)));
        (~expression.indexOf('#'))&&(retNode=node.getElementById(expression.substring(1)));
        if(retNode){
            return retNode;
        }
        return node.getElementsByTagName(expression);
    }
    function getStyle(node,prop,isToNumber) {
        var value=window.getComputedStyle(node).getPropertyValue(prop);
        return isToNumber?parseInt(value):value;
    }
    function addClass(node,className) {
        var oldClassName=node.className;
        var newClassName='';
        newClassName=(oldClassName===''?className:(oldClassName+' '+className));
        newClassName=newClassName.replace(/\r+/g,'');
        node.className=newClassName;
    }
    function removeClass(node,className) {
        var oldClassName= node.className;
        var Reg=new RegExp(' '+className+' ');
        var newClassName=(' '+oldClassName+' ').replace(Reg,' ');
        node.className=newClassName.replace(/^\r|\r$/,'');//删除前后空格
    }
    function hasClass(node, className){
        var obj_class = node.className;//获取 class 内容.
        var obj_class_lst = obj_class.split(/\s+/);//通过split空字符将cls转换成数组.

        for(var x in obj_class_lst) {
            if(obj_class_lst[x] == className) {//循环数组, 判断是否包含cls
                return true;
            }
        }
        return false;
    }
    function getClassNum(node,className){
        var oldClassName=' '+ node.className+' ';
        var Reg=new RegExp(' '+className+'([0-9]{1}) ');//正则匹配
        Reg.test(oldClassName);
        return RegExp.$1;
    }
    return{
        extend:extend,
        h2n:html2node,
        $:getElement,
        getStyle:getStyle,
        addClass:addClass,
        removeClass:removeClass,
        getClassNum:getClassNum,
        hasClass:hasClass,
    }
})()

function CellMove(options){
    options=options||{};
    this.itemText=[['A',1,2,3],['B',4,5,6],['C',7,8,9],['D',10,11,12]];
    this.prefix=['js-row-','js-col-'];
    this.mouseHold=false;
    this.holdNode=null;
    var defaultOptions={
        template:"<div class='movable-item'></div>",
        el:'.cell-container'
    }
    _.extend(options,defaultOptions);
    this.options=options;
    this._containerHeight=0;
    this._containerWidth=0;
    this._itemHeight=0;
    this._itemWidth=0;
    this._layout=null;//容器的node
    this._oldPos={x:0,y:0};
    this._init();
}
_.extend(CellMove.prototype,{
   _init:function () {
       this._initLayout();
       this._initEvent();
   },
    _initLayout:function () {
        this._layout=_.$(this.options.el)[0];
        //获取容器宽高并计算出item的宽高
        this._containerHeight=_.getStyle(this._layout,'height',true);
        this._containerWidth=_.getStyle(this._layout,'width',true);
        this._itemHeight=this._containerHeight/4;
        this._itemWidth=this._containerWidth/4;
        var itemLayout=_.h2n(this.options.template);
        for(var i=0;i<4;i++){
            for(var j=0;j<4;j++){//i=col j=row
                //克隆item的node并且设置宽高和初始的类
                var _itemLayout=itemLayout.cloneNode(true);
                _.addClass(_itemLayout,this.prefix[1]+i);
                _.addClass(_itemLayout,this.prefix[0]+j);
                if(j===0){
                    _.addClass(_itemLayout,'special');//设置第一行元素为special元素
                }
                _itemLayout.style.width=this._itemWidth+'px';
                _itemLayout.style.height=this._itemHeight+'px';
                _itemLayout.style.lineHeight=this._itemHeight+'px';
                _itemLayout.innerText=this.itemText[i][j];
                this._layout.appendChild(_itemLayout);
            }
        }
        this._reOrder();

    },

    _initEvent:function () {
        var that=this;
        this._layout.addEventListener('mousedown',function (e) {
            if((!that.mouseHold)&&(~e.target.className.indexOf('movable-item'))){//按下的node是否有movable-item这个类
                e.preventDefault();
                that._oldPos.x=e.clientX-e.target.offsetLeft;
                that._oldPos.y=e.clientY-e.target.offsetTop;
                that.mouseHold=true;

                that.holdNode=e.target;//获取移动的node 防止移动时e.target改变而出错
                // console.log(that.holdNode);
            }
        });
        this._layout.addEventListener('mousemove',function (e) {
            if(!that.mouseHold){return;}
            that.holdNode.style.left=e.clientX- that._oldPos.x+'px';
            that.holdNode.style.top=e.clientY- that._oldPos.y+'px';//跟随鼠标移动

        })
        this._layout.addEventListener('mouseup',function (e) {
            var holdNodeLeft=_.getStyle(that.holdNode,'left',true);
            var holdNodeTop=_.getStyle(that.holdNode,'top',true);
            var sourceRow=_.getClassNum(that.holdNode,'js-row-');
            var sourceCol=_.getClassNum(that.holdNode,'js-col-');
            var dstRow=Math.ceil((holdNodeTop+e.offsetY)/that._itemHeight)-1;
            var dstCol=Math.ceil((holdNodeLeft+e.offsetX)/that._itemWidth)-1;
            (dstCol<0)&&(dstCol=0)
            (dstCol>4)&&(dstCol=4)
            (dstRow<0)&&(dstRow=0)
            (dstRow>4)&&(dstRow=4)//判断边界
            // console.log(sourceRow,sourceCol,dstRow,dstCol);
            var sourceSpecial=_.hasClass(that.holdNode,'special');
            var dstNode=document.querySelector('.js-row-'+dstRow+'.js-col-'+dstCol);
            var dstSpecial=_.hasClass(dstNode,'special');
            // console.log(sourceSpecial,dstSpecial);
            // console.log(sourceRow,sourceCol,dstRow,dstCol);
            (sourceSpecial&&dstSpecial)&&(that._moveColOrRow(sourceCol,dstCol,true));//两个特殊元素交换，则交换列
            (sourceSpecial&&!dstSpecial&&(+dstCol===(+sourceCol)))&&(that._moveColOrRow(sourceRow,dstRow,false));
            (!sourceSpecial&&!dstSpecial)&&(that._moveCell(that.holdNode,dstNode));
            (!sourceSpecial&&dstSpecial)&&(alert('非法移动!'));
            that._reOrder();
            that.mouseHold=false;
            that.holdNode=null;
        })
    },
    /**
     *
     * @param sourceNode
     * @param dstNode
     * @private
     */
    _moveCell:function(sourceNode,dstNode){
        var dstRow=_.getClassNum(dstNode,'js-row-');
        var dstCol=_.getClassNum(dstNode,'js-col-');
        var sourceRow=_.getClassNum(sourceNode,'js-row-');
        var sourceCol=_.getClassNum(sourceNode,'js-col-');
        //col 和 row 调整
        _.addClass(sourceNode,'js-col-'+dstCol);
        _.addClass(sourceNode,'js-row-'+dstRow);
        _.removeClass(sourceNode,'js-col-'+sourceCol);
        _.removeClass(sourceNode,'js-row-'+sourceRow);

        _.addClass(dstNode,'js-col-'+sourceCol);
        _.addClass(dstNode,'js-row-'+sourceRow);
        _.removeClass(dstNode,'js-col-'+dstCol);
        _.removeClass(dstNode,'js-row-'+dstRow);
    },
    /**
     * 
     * @param sourceRowOrCol 源列或行
     * @param dstRowOrCol 目标列或行
     * @param rowOrCol 列移动或行移动
     * @private
     */
    _moveColOrRow:function (sourceRowOrCol,dstRowOrCol,rowOrCol) {//false=row,true=col;
        // var rrc=+(Math.abs(ARow-relRow)>=Math.abs(ACol-relCol));//row or col
        var sourceClassName=this.prefix[+rowOrCol]+sourceRowOrCol;
        var dstClassName=this.prefix[+rowOrCol]+dstRowOrCol;
        var sourceList=document.querySelectorAll('.'+sourceClassName);
        var dstList=document.querySelectorAll('.'+dstClassName);
        // console.log(sourceClassName,dstClassName)
        for(var i in sourceList){
            _.addClass(sourceList[i],dstClassName);
            _.removeClass(sourceList[i],sourceClassName);
        }
        for(var i in dstList){
            _.addClass(dstList[i],sourceClassName);
            _.removeClass(dstList[i],dstClassName)
        }
    },
    _reOrder:function () {//重新位置规整函数
        var node=null;
      for(var i=0;i<4;i++){
          for(var j=0;j<4;j++){
              node=document.querySelector('.js-col-'+i+'.js-row-'+j)
              node.style.top=this._itemHeight*j+'px';
              node.style.left=this._itemWidth*i+'px';
          }
      }

    }
});
