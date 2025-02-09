
//棋盘坐标字典
var pos = {"0":{"x":918,"y":685},"1":{"x":852,"y":705},"2":{"x":794,"y":704},"3":{"x":729,"y":681},"4":{"x":681,"y":728},"5":{"x":706,"y":793},"6":{"x":706,"y":852},"7":{"x":685,"y":918},"8":{"x":616,"y":940},"9":{"x":558,"y":940},"10":{"x":499,"y":940},"11":{"x":443,"y":940},"12":{"x":384,"y":940},"13":{"x":318,"y":921},"14":{"x":296,"y":851},"15":{"x":296,"y":793},"16":{"x":318,"y":728},"17":{"x":269,"y":684},"18":{"x":207,"y":704},"19":{"x":149,"y":704},"20":{"x":85,"y":684},"21":{"x":60,"y":616},"22":{"x":60,"y":559},"23":{"x":60,"y":499},"24":{"x":60,"y":441},"25":{"x":60,"y":382},"26":{"x":80,"y":317},"27":{"x":149,"y":294},"28":{"x":207,"y":294},"29":{"x":269,"y":316},"30":{"x":318,"y":274},"31":{"x":296,"y":206},"32":{"x":296,"y":148},"33":{"x":319,"y":83},"34":{"x":384,"y":59},"35":{"x":443,"y":59},"36":{"x":501,"y":59},"37":{"x":559,"y":59},"38":{"x":617,"y":59},"39":{"x":680,"y":87},"40":{"x":706,"y":149},"41":{"x":706,"y":208},"42":{"x":680,"y":279},"43":{"x":724,"y":322},"44":{"x":795,"y":297},"45":{"x":853,"y":297},"46":{"x":918,"y":322},"47":{"x":940,"y":385},"48":{"x":940,"y":442},"49":{"x":937,"y":504},"50":{"x":940,"y":559},"51":{"x":940,"y":617},"100":{"x":830,"y":831},"101":{"x":936,"y":831},"102":{"x":830,"y":934},"103":{"x":936,"y":934},"104":{"x":965,"y":729},"105":{"x":848,"y":504},"106":{"x":790,"y":504},"107":{"x":732,"y":504},"108":{"x":675,"y":504},"109":{"x":617,"y":504},"110":{"x":559,"y":504},"200":{"x":66,"y":832},"201":{"x":170,"y":832},"202":{"x":66,"y":935},"203":{"x":170,"y":935},"204":{"x":271,"y":963},"205":{"x":501,"y":853},"206":{"x":501,"y":796},"207":{"x":501,"y":738},"208":{"x":501,"y":680},"209":{"x":501,"y":623},"210":{"x":501,"y":565},"300":{"x":66,"y":68},"301":{"x":171,"y":68},"302":{"x":66,"y":171},"303":{"x":171,"y":171},"304":{"x":32,"y":268},"305":{"x":153,"y":499},"306":{"x":210,"y":499},"307":{"x":268,"y":499},"308":{"x":326,"y":499},"309":{"x":383,"y":499},"310":{"x":441,"y":499},"400":{"x":831,"y":66},"401":{"x":935,"y":66},"402":{"x":831,"y":169},"403":{"x":935,"y":169},"404":{"x":730,"y":33},"405":{"x":501,"y":157},"406":{"x":501,"y":215},"407":{"x":501,"y":273},"408":{"x":501,"y":330},"409":{"x":501,"y":388},"410":{"x":501,"y":446}};
var game_size = 1000;
var plane_size = 35;
var blur_size = 8;
var animatedTime = 1000;
var frames = 60;
//房间号,飞机位置数据,当前玩家,骰子点数,名人堂,canvas,ctx,背景图片,飞机图片,我方所执颜色,是否轮到我方飞,是否托管
var roomNum,parking,current,roll,champions,c,ctx,bg,planes,colour,isAllowFly=0,hosted=false;
window.onload=function(){
c = document.getElementById('cv');
c.width = 1000;
c.height = 1000;
ctx = c.getContext('2d');
bg = document.getElementById("board");
planes = document.getElementById("chess");
ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, c.width, c.height);  //绘制背景
parking = {'r0': 0, 'r1': 1, 'r2': 2, 'r3': 3, 'r4': 4, 'r5': 5, 'r6': 6, 'r7': 7, 'r8': 8, 'r9': 9, 'r10': 10, 'r11': 11, 'r12': 12, 'r13': 13, 'r14': 14, 'r15': 15, 'r16': 16, 'r17': 17, 'r18': 18, 'r19': 19, 'r20': 20, 'r21': 21, 'r22': 22, 'r23': 23, 'r24': 24, 'r25': 25, 'r26': 26, 'r27': 27, 'r28': 28, 'r29': 29, 'r30': 30, 'r31': 31, 'r32': 32, 'r33': 33, 'r34': 34, 'r35': 35, 'r36': 36, 'r37': 37, 'r38': 38, 'r39': 39, 'r40': 40, 'r41': 41, 'r42': 42, 'r43': 43, 'r44': 44, 'r45': 45, 'r46': 46, 'r47': 47, 'r48': 48, 'r49': 49, 'r50': 50, 'r51': 51, 'r100': 100, 'r101': 101, 'r102': 102, 'r103': 103, 'r104': 104, 'r105': 105, 'r106': 106, 'r107': 107, 'r108': 108, 'r109': 109, 'r110': 110, 'r200': 200, 'r201': 201, 'r202': 202, 'r203': 203, 'r204': 204, 'r205': 205, 'r206': 206, 'r207': 207, 'r208': 208, 'r209': 209, 'r210': 210, 'r300': 300, 'r301': 301, 'r302': 302, 'r303': 303, 'r304': 304, 'r305': 305, 'r306': 306, 'r307': 307, 'r308': 308, 'r309': 309, 'r310': 310, 'r400': 400, 'r401': 401, 'r402': 402, 'r403': 403, 'r404': 404, 'r405': 405, 'r406': 406, 'r407': 407, 'r408': 408, 'r409': 409, 'r410': 410};

for (var i in parking)
	draw_plane(i);
}

function draw_plane(planeName) {
    if (planeName.charAt(0) == 'y')
        ctx.drawImage(planes, 0, 0, planes.width/2, planes.height/2, pos[parking[planeName]]["x"]-plane_size/2, pos[parking[planeName]]["y"]-plane_size/2, plane_size, plane_size);
    else if (planeName.charAt(0) == 'b')
        ctx.drawImage(planes, planes.width/2, 0, planes.width/2, planes.height/2, pos[parking[planeName]]["x"]-plane_size/2, pos[parking[planeName]]["y"]-plane_size/2, plane_size, plane_size);
    else if (planeName.charAt(0) == 'g')
        ctx.drawImage(planes, planes.width/2, planes.height/2, planes.width/2, planes.height/2, pos[parking[planeName]]["x"]-plane_size/2, pos[parking[planeName]]["y"]-plane_size/2, plane_size, plane_size);
    else
        ctx.drawImage(planes, 0, planes.height/2, planes.width/2, planes.height/2, pos[parking[planeName]]["x"]-plane_size/2, pos[parking[planeName]]["y"]-plane_size/2, plane_size, plane_size);
}

