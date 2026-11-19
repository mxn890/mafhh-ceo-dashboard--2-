'use strict';
function seatViewport(value){
 if(!Array.isArray(value)||value.length!==4||value.some(v=>typeof v!=='number'||!Number.isFinite(v)))return null;
 const [x,y,right,bottom]=value;
 if(x<0||y<0||right>1||bottom>1||right<=x||bottom<=y)return null;
 const w=right-x,h=bottom-y;
 return {aspectRatio:`${960*w} / ${1080*h}`,videoStyle:{position:'absolute',width:`${100/w}%`,maxWidth:'none',height:'auto',left:`${-100*x/w}%`,top:`${-100*y/h}%`}};
}
module.exports={seatViewport};
