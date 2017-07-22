/**
 * Created by louyq on 2017/7/19.
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
        oldClassName===''?node.className=className:
        node.className=oldClassName+' '+className;
    }
    function removeClass(node,className) {
        var oldClassName= node.className;
        var Reg=new RegExp(' '+className+' ');
        var newClassName=(' '+oldClassName+' ').replace(Reg,' ');
        node.className=newClassName.replace(/^\r|\r$/,'');//删除前后空格
    }
    return{
        extend:extend,
        h2n:html2node,
        $:getElement,
        getStyle:getStyle,
        addClass:addClass,
        removeClass:removeClass,
    }
})()
var imgUpload=_.$('.js-img-upload')[0];
var imgContainer=_.$('.img-container')[0];
var cutContainer=_.$('.cutter-container')[0];
function setImageURL(url,node) {//设置图片
    node.setAttribute('src',url);
}
var cutter=(function (_) {//iife封装
    var maskTpl="<div class='img-container-mask'></div>";//遮罩模版
    var cutAreaTpl="<div class='img-cut-area'><canvas class='cut-show-canvas' width='100' height='100'></canvas> </div>";//裁剪区域模版
    var _layoutMask=_.h2n(maskTpl);
    var _layoutCutArea=_.h2n(cutAreaTpl);
    var pos={x:0,y:0};
    var area={left:0,top:0};
    var hold=false;
    var picCanvasNoCon=_.$('.cut-img-canvas')[0];
    var picCanvas=picCanvasNoCon.getContext('2d');
    var cutShowCanvas=_.$('.cut-show-canvas',_layoutCutArea)[0].getContext('2d');
    function setCut(){//设置遮罩层和裁剪框
        cutContainer.appendChild(_layoutMask);
        cutContainer.appendChild(_layoutCutArea);
        _drawImg(0,0,100,100,0,0,100,100);
        _initEvent();
    }
    function getDataUrl(){
        return  picCanvasNoCon.toDataURL('image/jpeg');
    }
    function _drawImg(sx,sy,sWidth,sHeight, dx, dy, dWidth,dHeight) {//画出裁剪图片
        picCanvas.drawImage(imgContainer, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        cutShowCanvas.drawImage(imgContainer, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    }
    function _initEvent() {//初始化事件
        picCanvas.clearRect(0,0,100,100);
        cutShowCanvas.clearRect(0,0,100,100);
        area.left=parseFloat(_.getStyle(_layoutCutArea,'left'))
        area.top=parseFloat(_.getStyle(_layoutCutArea,'top'))
        imgContainer.onload=function () {
            _drawImg(area.left,area.top,100,100,0,0,100,100);//+1的原因是有1px的边框
        }
        _layoutCutArea.addEventListener('mousedown',function (e) {
            e.preventDefault();
            pos.x=e.clientX;
            pos.y=e.clientY;
            area.left=parseFloat(_.getStyle(_layoutCutArea,'left'))
            area.top=parseFloat(_.getStyle(_layoutCutArea,'top'))

            hold=true;
        })
        var leftMax=0;
        var topMax=0;
        _layoutCutArea.addEventListener('mousemove',function (e) {

            if(!hold){return;}
            !leftMax&&(leftMax=(_.getStyle(imgContainer,'width',true)-_.getStyle(_layoutCutArea,'width',true)));
            !topMax&&(topMax=(_.getStyle(imgContainer,'height',true)-_.getStyle(_layoutCutArea,'height',true)));//下边界及右边界
            _layoutCutArea.style.left=area.left+e.clientX- pos.x+'px';
            _layoutCutArea.style.top=area.top+e.clientY- pos.y+'px';//跟随鼠标移动
            //限定裁剪框移动
            (parseInt(_layoutCutArea.style.top)<0)&&(_layoutCutArea.style.top=0);
            (parseInt(_layoutCutArea.style.left)<0)&& (_layoutCutArea.style.left=0);
            (parseInt(_layoutCutArea.style.left)>leftMax)&&(_layoutCutArea.style.left=leftMax+'px');
            (parseInt(_layoutCutArea.style.top)>topMax)&&(_layoutCutArea.style.top=topMax+'px');
            _drawImg(parseFloat(_layoutCutArea.style.left)+1,parseFloat(_layoutCutArea.style.top)+1,100,100,0,0,100,100);//+1的原因是有1px的边框
        })
        _layoutCutArea.addEventListener('mouseup',function (e) {hold=false;})
    }
    return {
        setCut:setCut,
        getDataUrl:getDataUrl,
    }
})(_);
imgUpload.addEventListener('change',function () {//图片上传监控
    var file=this.files[0];
    console.log(file);
    if(file.size>100*1024){
        alert('图片请小于100K!');
        return;
    }
    var reader=new FileReader();
    reader.onload=function(){
        // 通过 reader.result 来访问生成的 DataURL
        var url=reader.result;
        setImageURL(url,imgContainer);
        cutter.setCut();
    };
    reader.readAsDataURL(file);
})
_.$('#savePic').addEventListener('click',function (e) {//模拟上传
    var url=cutter.getDataUrl();
    var simUploadImg=_.$('.sim-img-upload')[0];
    setTimeout(function () {
        simUploadImg.style.display='block'
        simUploadImg.setAttribute('src',url);
        alert('上传成功')
    },1000)
})