
function plotH(ctx,pp) {
  var ps, p, minScale, xScale, yScale, gHeight, i, x, y;
  if(pp.minScale) { minScale = pp.minScale; } else { minScale = 1; }
  xScale = pp.xMax - pp.xMin;
  yScale = pp.yMax - pp.yMin;
  if(Math.abs(yScale) < minScale) { yScale = minScale; }
  gHeight = pp.to - pp.from;
  if(pp.yRn) { yRn = pp.yRn; } else { yRn = Math.round(gHeight/50); }
  stepRy = gHeight/yRn;
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.font = "10px Serif"; 
  ctx.textAlign = "start";
  ctx.fillText(pp.yLegend,pp.gWidth,pp.from - 10,40); //yLegend
  for(i=0; i<=yRn; i++) {
    y = i*stepRy + pp.from
    ctx.moveTo(0,y);
    ctx.lineTo(pp.gWidth+5,y);
    ctx.fillText(Math.round(-i*(yScale/yRn)+pp.yMax),pp.gWidth+15,y,40);
  }
  ctx.stroke(); //plot horizontales
  ctx.beginPath();
  if(pp.lw == undefined) { ctx.lineWidth = 2; } else { ctx.lineWidth = pp.lw; }
  ctx.strokeStyle = pp.lc;
  pp.fx = function (x) { return (x - pp.xMin)*pp.gWidth /xScale; }
  pp.fxr = function (y) { return (xScale*y+pp.gWidth*pp.xMin)/pp.gWidth; }
  pp.fy = function (y) { return pp.from + gHeight - ((y - pp.yMin)*gHeight /yScale); }
  //pp.fyr = function (x) { return pp.from*yScale/gHeight - x*yScale/gHeight + yScale +yMin; }
  pp.pnd = decimator(pp.gWidth,pp.pn);
  p = pp.pnd[0];
  if(p==undefined) { return; }
  ctx.moveTo(pp.fx(p.x),pp.fy(p.y));
  for(i=1; i<pp.pnd.length; i++) { 
    p = pp.pnd[i];
    x = pp.fx(p.x);
    y = pp.fy(p.y);
    ctx.lineTo(x,y); 
  }
  ctx.stroke(); //plot process line
  return {lc:pp.lc,lw:pp.lw,yLegend:pp.yLegend,gWidth:pp.gWidth,from:pp.from,to:pp.to,
      xMin:pp.xMin,yMax:pp.yMax,pn:pp.pn,pnd:pp.pnd,fx:pp.fx,fy:pp.fy,fxr:pp.fxr};
}

function plotHs(c,pps,d) {
  //pps = [{lc:"red", lw:1, from: 0, to:100, yRn:9, minScale:1, gWidth:canvax-70}]
  //ds = "xn,yn .. x1,y1 x0,y0;x1n,y1n .." string of points in reverse order
  var ds,ctx,h1,i,j,d1,pp1,k,img,x,xmd,xmu;
  k = []; 
  ds = d.split(";"); //array of rev proc strings
  ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,c.width,c.height);
  h1 = c.height /ds.length; //height for one line
  i = 0;
  while(1) {
    d1 = ds[i]; //rev prog in string
    pp1 = pps[i]; //params obj
    if(d1 == undefined || pp1 == undefined) { break; } //must be d1 and pp1
    pp1.from = i*h1 + 30; //add param from
    pp1.to = pp1.from + h1 - 60; //add parm to
    pp1.gWidth = c.width - 60; //add param graph width
    ps = d1.split(" "); //array string of "x,y" in reverse order
    pp1.pn = []; //array for proc points
    while(1) {
      p = ps.pop(); //get last 
      if(p == undefined) { break; }
      pk = p.split(",");
      x = pk[0] - 0; //x project
      y = pk[1] - 0; //y project
      if(x>pp1.xMax || pp1.xMax==undefined) { pp1.xMax = x; }
      if(x<pp1.xMin || pp1.xMin==undefined) { pp1.xMin = x; }
      if(y>pp1.yMax || pp1.yMax==undefined) { pp1.yMax = y; }
      if(y<pp1.yMin || pp1.yMin==undefined) { pp1.yMin = y; }
      pp1.pn.push({x:x,y:y}); //array of obj of numeric points x,y in normal order
    }
    k[i] = plotH(ctx,pp1);
    i++;
  }
  img = ctx.getImageData(0,0,c.width,c.height);
  c.addEventListener("mousemove",function () {
    ctx.clearRect(0,0,c.width,c.height);
    ctx.putImageData(img,0,0);
    x = event.clientX - c.offsetLeft;
    //y = event.clientY - c.offsetTop;
    //ctx.fillText(x + "," + y,x,y);
    if(x <= pps[0].gWidth) {
      ctx.beginPath();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.moveTo(x,0);
      ctx.lineTo(x,c.height);
      ctx.stroke();
      for(i=0; i<k.length; i++) { setPoint(ctx,k[i],x); }
    }
  });
  c.addEventListener("mousedown",function () { 
    xmd = x;
    img = ctx.getImageData(0,0,c.width,c.height) 
  });
 c.addEventListener("mouseup",function () {
   xmu = x;
   if(xmu - xmd > 5) {
     ctx.clearRect(0,0,c.width,c.height);
     for(i=0; i<k.length; i++) {
       k[i].xMin = k[i].fxr(xmd);
       k[i].xMax = k[i].fxr(xmu);
       k[i].pnd = [];
       j = 0;
       k[i].yMin = undefined;
       k[i].yMax = undefined;
       while(1) {
         if(k[i].pn[j] == undefined) { break; }
         if(k[i].pn[j].x > k[i].xMax) { break; }
         if(k[i].pn[j].x >= k[i].xMin) {
           if(k[i].yMin > k[i].pn[j].y || k[i].yMin == undefined) { k[i].yMin = k[i].pn[j].y; } 
           if(k[i].yMax < k[i].pn[j].y || k[i].yMax == undefined) { k[i].yMax = k[i].pn[j].y; } 
           k[i].pnd.push(k[i].pn[j]); 
         }
       j++;
       }
       k[i].pn = k[i].pnd;
       plotH(ctx,k[i]);
     }
   img = ctx.getImageData(0,0,c.width,c.height) 
   }
 })
}

function setPoint(ctx,k,x) {
  //k = {xMin:D, xMax:D, yMin:D, yMax:D, d:[{x:D,y:D}..], fx:xProc -> xPlot, fy:yProc -> yPlot}
  var px,py,y,ii,txt,stxt;
  for(i=0; i<=k.pnd.length; i++) { 
    if(k.pnd[i] == undefined) { return; }
    if(k.fx( k.pnd[i].x ) >= x) { break; } 
  }
  if(i==0) {return;}
  px = k.fxr(x);
  py = norm(k.pnd[i-1].x, k.pnd[i].x, k.pnd[i-1].y, k.pnd[i].y,px);
  y = Math.round(k.fy(py));
  txt = Math.round(px)+","+Math.round(py);
  stxt = ctx.measureText(txt);
  ctx.clearRect(x,y+2,stxt.width,-10);
  ctx.fillText(Math.round(px)+","+Math.round(py),x,y); //p xyProc
}

function norm(x0,x1,y0,y1,x) { return -(x0*y1-x*y1-x1*y0+x*y0)/(x1-x0); }

function decimator(w,pn) {
  var pnd,xMin,xMax,xStep,i;
  pnd = [];
  if(pn.length <= w) { return pn; }
  xMin = pn[0].x;
  xMax = pn[pn.length-1].x;
  xStep = (xMax - xMin)/(w-1);
  pnd.push(pn[0]); //add first element
  x = xMin + xStep;
  for(i=1; i<pn.length; i++) {
    if(pn[i].x >= x) {
      pnd.push({x:x,y:norm(pn[i-1].x,pn[i].x,pn[i-1].y,pn[i].y,x)});
      x += xStep;
    }
  }
  return pnd;
}


/*function parseProcess(pp,data) {
  var xMax,xMin,yMax,yMin,x,y,p;
  var c = document.getElementById(pp.id);
  var ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled=false;
  //ctx.imageSmoothingQuality="high";
  var p0 = 0;
  var p1 = -1;
  var points = [];
  while(1) {
    p0 = data.indexOf(",",p1);
    if(p0==-1) { break; }
    x = data.substring(p1+1,p0) - 0;
    p1 = data.indexOf(" ",p0);
    if(p1==-1) { break; }
    y = data.substring(p0+1,p1) - 0;
    if(x>xMax || xMax==undefined) { xMax = x; }
    if(x<xMin || xMin==undefined) { xMin = x; }
    if(y>yMax || yMax==undefined) { yMax = y; }
    if(y<yMin || yMin==undefined) { yMin = y; }
    points.push({x:x,y:y});
  }
  var minScale;
  if(pp.minScale) { minScale = pp.minScale; } else { minScale = 1; }
  var xScale = xMax - xMin;
  if(Math.abs(xScale) < minScale ) { xScale = minScale; }
  var yScale = yMax - yMin;
  if(Math.abs(yScale) < minScale) { yScale = minScale; }
  var gheight = c.height - 50
  var gwidth = c.width - 70;

  var xRn;
  if(pp.xRn) { xRn = pp.xRn; } else { xRn = 13; }
  var yRn;
  if(pp.yRn) { yRn = pp.yRn; } else { yRn = 9; }
  var stepRx = gwidth/xRn;
  var stepRy = gheight/yRn;
  //ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  if(pp.font) { ctx.font = pp.font; }
  var xRscale,yRscale,xRs,yRs;
  if(pp.xRscale) { xRscale = pp.xRscale; } else { xRscale = 1; }
  if(pp.yRscale) { yRscale = pp.yRscale; } else { yRscale = 1; }
  if(pp.xRs) { xRs = pp.xRs; } else { xRs = 1; }
  if(pp.yRs) { yRs = pp.yRs; } else { yRs = 1; }
  var i;
  ctx.clearRect(0,0,c.width,c.height);
  ctx.textAlign = "center";
  ctx.fillText(pp.xLegend,c.width/2,c.height-2);
  ctx.textAlign = "start";
  ctx.fillText(pp.yLegend,c.width-60,20,60);
  for(i=1; i<=xRn; i++) {
    ctx.moveTo(i*stepRx,0);
    ctx.lineTo(i*stepRx,gheight+15);
    ctx.fillText(Math.round(i*xScale/xRn*xRscale)*xRs,i*stepRx,gheight+30,30);
  }
  for(i=1; i<=yRn; i++) {
    ctx.moveTo(0,i*stepRy);
    ctx.lineTo(gwidth+15,i*stepRy);
    ctx.fillText(Math.round((-i*(yScale/yRn)+yMax)*yRscale)*yRs,gwidth+20,i*stepRy,30);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = pp.lw;
  ctx.strokeStyle = pp.lc;
  var fx = function (x) { return (x - xMin)*gwidth /xScale; }
  var fy = function (y) { return gheight - ((y - yMin)*gheight /yScale); }
  p = points.pop();
  if(p==undefined) { return; }
  ctx.moveTo(fx(p.x),fy(p.y));
  while(1) { 
    p = points.pop();
    if(p==undefined) { break; }
    var x1 = fx(p.x);
    var y1 = fy(p.y);
    ctx.lineTo(x1,y1); 
  }
  ctx.stroke();
}*/
