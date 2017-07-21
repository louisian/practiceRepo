/**
 * Created by 95 on 2017/7/18.
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
        if(~expression.indexOf('.')){
            return node.getElementsByClassName(expression.substring(1));
        }
        if(~expression.indexOf('#')){
            return node.getElementById(expression.substring(1));
        }
        return node.getElementsByTagName(expression);
    }
    function getStyle(node,prop,isToNumber) {
        var value=window.getComputedStyle(node).getPropertyValue(prop);
        return isToNumber?parseInt(value):value;
    }
    function addClass(node,className) {
        var oldClassName=node.className;
        if(oldClassName===''){
            node.className=className;
        }else{
            node.className=oldClassName+' '+className;
        }
    }
    function removeClass(node,className) {
        var oldClassName= node.className;
        var Reg=new RegExp(' '+className+' ');
        var newClassName=(' '+oldClassName+' ').replace(Reg,' ');
        node.className=newClassName.replace(/^\r|\r$/,'');//删除前后空格
    }
    function getClassNum(node,className){
        var oldClassName=' '+ node.className+' ';
        var Reg=new RegExp(' '+className+'([0-9]{1,1}) ');//正则匹配
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
        getClassNum:getClassNum
    }
})()

function CellMove(options={}){
    this.itemText=[['A',1,2,3],['B',4,5,6],['C',7,8,9],['D',10,11,12]];
    this.prefix=['js-col-','js-row-'];
    this.mouseHold=false;
    this.holdNode=null;
    var defaultOptions={
        template:"<div class='movable-item' ></div>",
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
                _.addClass(_itemLayout,this.prefix[0]+i);
                _.addClass(_itemLayout,this.prefix[1]+j);
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
            }



        });
        this._layout.addEventListener('mousemove',function (e) {

            if(!that.mouseHold){return;}

            that.holdNode.style.left=e.clientX- that._oldPos.x+'px';
            that.holdNode.style.top=e.clientY- that._oldPos.y+'px';//跟随鼠标移动

        })
        this._layout.addEventListener('mouseup',function (e) {

           var relRow=_.getClassNum(e.target,'js-row-');
           var relCol=_.getClassNum(e.target,'js-col-');

           if(that.holdNode.innerText==='A'){//如果移动的是A格
                var ARow=_.getClassNum(that.holdNode,'js-row-');
                var ACol=_.getClassNum(that.holdNode,'js-col-');
                var rrc=+(Math.abs(ARow-relRow)>=Math.abs(ACol-relCol));
                //判断是列移动还是行移动
                //行移动大于等于列移动=>行移动 反之则是 列移动
                var AClassName=that.prefix[rrc]+(rrc?ARow:ACol);
                var relClassName=that.prefix[rrc]+(rrc?relRow:relCol);
                var AList=document.querySelectorAll('.'+AClassName);
                var relList=document.querySelectorAll('.'+relClassName);
                for(var i in AList){
                    _.addClass(AList[i],relClassName);
                    _.removeClass(AList[i],AClassName);
                }
                for(var i in relList){
                    _.addClass(relList[i],AClassName);
                    _.removeClass(relList[i],relClassName)
                }
            }else{
               //获取当前的col 和 row
               var relRow=_.getClassNum(e.target,'js-row-');
               var relCol=_.getClassNum(e.target,'js-col-');
               var holdRow=_.getClassNum(that.holdNode,'js-row-');
               var holdCol=_.getClassNum(that.holdNode,'js-col-');
               //col 和 row 调整
               _.addClass(that.holdNode,'js-col-'+relCol);
               _.addClass(that.holdNode,'js-row-'+relRow);
               _.removeClass(that.holdNode,'js-col-'+holdCol);
               _.removeClass(that.holdNode,'js-row-'+holdRow);

               _.addClass(e.target,'js-col-'+holdCol);
               _.addClass(e.target,'js-row-'+holdRow);
               _.removeClass(e.target,'js-col-'+relCol);
               _.removeClass(e.target,'js-row-'+relRow);
           }
            that._reOrder();
            that.mouseHold=false;
            that.holdNode=null;

        })
    },
    _reOrder:function () {//重新位置规整函数
      for(var i=0;i<4;i++){
          for(var j=0;j<4;j++){
              var node=document.querySelector('.js-col-'+i+'.js-row-'+j)
              node.style.top=this._itemHeight*j+'px';
              node.style.left=this._itemWidth*i+'px';
          }

      }

    }
});
