window.onload = function () {
    document.getElementById('bd').innerHTML = '请输入/创建房间号：<input id="roomNum" autofocus="autofocus" onkeypress="if(event.keyCode==13){sendrm.click();return false;}"/><button id="sendrm" onclick="send_roomNum()">确定</button>';
    if (document.documentElement.clientWidth < 1008)
        document.getElementsByTagName('html')[0].style.width = "1008px";
}

window.onresize = function(){
    document.getElementsByTagName('html')[0].style.width = document.documentElement.clientWidth < 1008 ? "1008px" : document.documentElement.clientWidth+"px";
}

//棋盘坐标字典
var pos = {"0":{"x":918,"y":685},"1":{"x":852,"y":705},"2":{"x":794,"y":704},"3":{"x":729,"y":681},"4":{"x":681,"y":728},"5":{"x":706,"y":793},"6":{"x":706,"y":852},"7":{"x":685,"y":918},"8":{"x":616,"y":940},"9":{"x":558,"y":940},"10":{"x":499,"y":940},"11":{"x":443,"y":940},"12":{"x":384,"y":940},"13":{"x":318,"y":921},"14":{"x":296,"y":851},"15":{"x":296,"y":793},"16":{"x":318,"y":728},"17":{"x":269,"y":684},"18":{"x":207,"y":704},"19":{"x":149,"y":704},"20":{"x":85,"y":684},"21":{"x":60,"y":616},"22":{"x":60,"y":559},"23":{"x":60,"y":499},"24":{"x":60,"y":441},"25":{"x":60,"y":382},"26":{"x":80,"y":317},"27":{"x":149,"y":294},"28":{"x":207,"y":294},"29":{"x":269,"y":316},"30":{"x":318,"y":274},"31":{"x":296,"y":206},"32":{"x":296,"y":148},"33":{"x":319,"y":83},"34":{"x":384,"y":59},"35":{"x":443,"y":59},"36":{"x":501,"y":59},"37":{"x":559,"y":59},"38":{"x":617,"y":59},"39":{"x":680,"y":87},"40":{"x":706,"y":149},"41":{"x":706,"y":208},"42":{"x":680,"y":279},"43":{"x":724,"y":322},"44":{"x":795,"y":297},"45":{"x":853,"y":297},"46":{"x":918,"y":322},"47":{"x":940,"y":385},"48":{"x":940,"y":442},"49":{"x":937,"y":504},"50":{"x":940,"y":559},"51":{"x":940,"y":617},"100":{"x":830,"y":831},"101":{"x":936,"y":831},"102":{"x":830,"y":934},"103":{"x":936,"y":934},"104":{"x":965,"y":729},"105":{"x":848,"y":504},"106":{"x":790,"y":504},"107":{"x":732,"y":504},"108":{"x":675,"y":504},"109":{"x":617,"y":504},"110":{"x":559,"y":504},"200":{"x":66,"y":832},"201":{"x":170,"y":832},"202":{"x":66,"y":935},"203":{"x":170,"y":935},"204":{"x":271,"y":963},"205":{"x":501,"y":853},"206":{"x":501,"y":796},"207":{"x":501,"y":738},"208":{"x":501,"y":680},"209":{"x":501,"y":623},"210":{"x":501,"y":565},"300":{"x":66,"y":68},"301":{"x":171,"y":68},"302":{"x":66,"y":171},"303":{"x":171,"y":171},"304":{"x":32,"y":268},"305":{"x":153,"y":499},"306":{"x":210,"y":499},"307":{"x":268,"y":499},"308":{"x":326,"y":499},"309":{"x":383,"y":499},"310":{"x":441,"y":499},"400":{"x":831,"y":66},"401":{"x":935,"y":66},"402":{"x":831,"y":169},"403":{"x":935,"y":169},"404":{"x":730,"y":33},"405":{"x":501,"y":157},"406":{"x":501,"y":215},"407":{"x":501,"y":273},"408":{"x":501,"y":330},"409":{"x":501,"y":388},"410":{"x":501,"y":446}};
var playerIcon = {"red":"🦊","yellow":"🐤","blue":"🐳","green":"🐸","observe":"🐼"};
var translate = {"red":"红","yellow":"黄","blue":"蓝","green":"绿","observe":"观众"+randomString(2)};
var game_size = 1000;
var plane_size = 35;
var blur_size = 8;
var animatedTime = 1000;
var frames = 60;
//昵称,房间号,飞机位置数据,当前玩家,骰子点数,名人堂,canvas,ctx,背景图片,飞机图片,我方所执颜色,是否轮到我方飞,是否托管,是否播放音乐
var nickName,roomNum,parking,current,roll,champions,c,ctx,bg,planes,colour,isAllowFly=0,hosted=false,music=true;

var ws = new WebSocket("ws://"+window.location.host+"/ws");

ws.onmessage = function (e) {
    var instruction = e.data.slice(0,4);
    if (instruction == "#CR*"){  //CreateRoom
        document.getElementById('bd').innerHTML = e.data.slice(4);
    }
    else if (instruction == "#CC*"){  //colorChoice
        document.title += ' 房间号:'+roomNum;
        document.getElementById('bd').innerHTML = e.data.slice(4);
    }
    else if (instruction == "#RE*"){  //roomExisted
        window.alert('该房间已存在。');
        location.reload();
    }
    else if (instruction == "#RM*"){  //roomMissing
        window.alert('该房间已关闭，请重新创建/加入房间。');
        location.reload();
    }
    else if (instruction == "#CF*"){  //chooseFailed
        window.alert('这个位置被占啦，换一个吧。')
    }
    else if (instruction == "#SG*"){  //startGame
        var data = e.data.slice(4).split('***');
        document.getElementById('bd').innerHTML = data[0];
        startGame(JSON.parse(data[1]),data[2]);
    }
    else if (instruction == "#RL*"){  //roll
        var data = e.data.slice(4).split('***');
        roll = parseInt(data[0]);
        animatedUpdateRoll(data[1],data[2]);
    }
    else if (instruction == "#FY*"){  //fly
        var data = JSON.parse(e.data.slice(4));
        animatedUpdateGame(data);
        //staticUpdateGame(data);
    }
    else if (instruction == "#FF*") {  //flyFailed
        isAllowFly = 1;
    }
    else if (instruction == "#MG*"){  //message
        var data = e.data.slice(4);
        var his_box = document.getElementById('history');
        his_box.innerHTML = his_box.value + data;
        his_box.scrollTop = his_box.scrollHeight;
    }
}

ws.onclose = function () {
    var bgm = document.getElementById("bgm");
    bgm.pause();
    window.alert('连接断开，请尝试重新连接。');
    location.reload();
}

function randomString(len) {
    //生成随机字符串，len为长度
　　len = len || 32;
　　var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
　　var maxPos = $chars.length;
　　var pwd = '';
　　for (i = 0; i < len; i++) {
　　　　pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
　　}
　　return pwd;
}

function send_roomNum() {
    roomNum = document.getElementById("roomNum").value;
    if (roomNum)
        ws.send('#RN*'+roomNum);
    else
        window.alert('房间号不能为空。');
}

function send_roomSetting() {
    var red = document.getElementById('red').value;
    var yellow = document.getElementById('yellow').value;
    var blue = document.getElementById('blue').value;
    var green = document.getElementById('green').value;
    if (red != "none" || yellow != "none" || blue != "none" || green != "none")
        ws.send('#RS*'+'["'+roomNum+'",{"red":"'+red+'","yellow":"'+yellow+'","blue":"'+blue+'","green":"'+green+'","observe":[]}]');
    else
        window.alert('房间不能没有角色');
}

function send_colorChoice() {
    nickName = document.getElementById('nickName').value;
    if (nickName.length > 10){
        window.alert("昵称不能超过10个字符。");
        document.getElementById('nickName').value = "";
        nickName = "";
    }
    else {
        colour = document.getElementById('color').value;
        ws.send('#CC*' + '["' + roomNum + '","' + colour + '"]');
    }
}

function send_roll() {
    ws.send('#RL*'+roomNum)
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

function animated_draw_planes(fpark, tpark) {
    function f(i) {
        setTimeout(function () {
            ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, c.width, c.height);  //绘制背景
            for (var p in fpark) {  //遍历绘制飞机
                if (p.charAt(0) == 'y')
                    ctx.drawImage(planes, 0, 0, planes.width / 2, planes.height / 2,
                        (pos[fpark[p]]["x"] - plane_size / 2) + (((pos[tpark[p]]["x"] - plane_size / 2) - (pos[fpark[p]]["x"] - plane_size / 2)) / frames) * i,
                        (pos[fpark[p]]["y"] - plane_size / 2) + (((pos[tpark[p]]["y"] - plane_size / 2) - (pos[fpark[p]]["y"] - plane_size / 2)) / frames) * i,
                        plane_size, plane_size);
                else if (p.charAt(0) == 'b')
                    ctx.drawImage(planes, planes.width / 2, 0, planes.width / 2, planes.height / 2,
                        (pos[fpark[p]]["x"] - plane_size / 2) + (((pos[tpark[p]]["x"] - plane_size / 2) - (pos[fpark[p]]["x"] - plane_size / 2)) / frames) * i,
                        (pos[fpark[p]]["y"] - plane_size / 2) + (((pos[tpark[p]]["y"] - plane_size / 2) - (pos[fpark[p]]["y"] - plane_size / 2)) / frames) * i,
                        plane_size, plane_size);
                else if (p.charAt(0) == 'g')
                    ctx.drawImage(planes, planes.width / 2, planes.height / 2, planes.width / 2, planes.height / 2,
                        (pos[fpark[p]]["x"] - plane_size / 2) + (((pos[tpark[p]]["x"] - plane_size / 2) - (pos[fpark[p]]["x"] - plane_size / 2)) / frames) * i,
                        (pos[fpark[p]]["y"] - plane_size / 2) + (((pos[tpark[p]]["y"] - plane_size / 2) - (pos[fpark[p]]["y"] - plane_size / 2)) / frames) * i,
                        plane_size, plane_size);
                else
                    ctx.drawImage(planes, 0, planes.height / 2, planes.width / 2, planes.height / 2,
                        (pos[fpark[p]]["x"] - plane_size / 2) + (((pos[tpark[p]]["x"] - plane_size / 2) - (pos[fpark[p]]["x"] - plane_size / 2)) / frames) * i,
                        (pos[fpark[p]]["y"] - plane_size / 2) + (((pos[tpark[p]]["y"] - plane_size / 2) - (pos[fpark[p]]["y"] - plane_size / 2)) / frames) * i,
                        plane_size, plane_size);
            }
            //绘制合体数字
            var fPosPlaneNum = {}
            for (var p in fpark){
                if (fPosPlaneNum[fpark[p]] === undefined)
                    fPosPlaneNum[fpark[p]] = [1,p];
                else
                    fPosPlaneNum[fpark[p]][0]++;
            }
            for (var po in fPosPlaneNum) {
                if (fPosPlaneNum[po][0] > 1 && [104,204,304,404].indexOf(parseInt(po)) == -1 && [100,101,102,103,200,201,202,203,300,301,302,303,400,401,402,403].indexOf(parseInt(tpark[fPosPlaneNum[po][1]])) == -1) {
                    ctx.font = plane_size + "px Verdana";
                    ctx.fillText(fPosPlaneNum[po][0].toString(),
                        pos[po]["x"] + ((pos[tpark[fPosPlaneNum[po][1]]]["x"] - pos[po]["x"]) / frames) * i,
                        pos[po]["y"] + ((pos[tpark[fPosPlaneNum[po][1]]]["y"] - pos[po]["y"]) / frames) * i,
                        plane_size);
                }
            }
            var tPosPlaneNum = {}
            for (var p in tpark){
                if (tPosPlaneNum[tpark[p]] === undefined)
                    tPosPlaneNum[tpark[p]] = 1;
                else
                    tPosPlaneNum[tpark[p]]++;
            }
            for (var po in [0,1,2,3]) {  //绘制起点处的合体数字
                po = (parseInt(po) + 1) * 100 + 4;
                if (fPosPlaneNum[po] === undefined)
                    continue;
                if (fPosPlaneNum[po][0] >= 2 && tPosPlaneNum[po] >= 2) {
                    ctx.font = plane_size + "px Verdana";
                    ctx.fillText((fPosPlaneNum[po][0] <= tPosPlaneNum[po] ? fPosPlaneNum[po][0] : tPosPlaneNum[po]).toString(),
                        pos[po]["x"],
                        pos[po]["y"],
                        plane_size);
                }
            }
        }, (animatedTime / frames) * i);
    }
    for (var i = 1; i <= frames; i++) {  //循环frames帧
        f(i);
    }
}

function startGame(data,rldata) {
    c = document.getElementById('cv');
    c.width = game_size;
    c.height = game_size;
    ctx = c.getContext('2d');
    bg = document.getElementById("board");
    planes = document.getElementById("chess");

    parking = data["parking"];
    current = data["current"];
    isAllowFly = 0;
    if (parseInt(data["roll"]) != 0) {
        roll = parseInt(data['roll']);
        staticUpdateGame(data);
        staticUpdateRoll(rldata);
    } else {
        staticUpdateGame(data);
    }
    ws.send("#SG*"+roomNum);
    editMessage("已进入房间。");
    var bgm = document.getElementById("bgm");
    bgm.currentTime = 0;
    bgm.play();
}

function staticUpdateGame(data) {
    parking = data["parking"];
    current = data["current"];
    champions = data["champions"]
    if (current == "end")
        status_html = 'Victory！';
    else
        status_html = '当前轮到'+translate[current]+'方';
    if (colour == current)
        status_html += ' <button onclick="send_roll()" style="font-size: 50px">骰子</button>';
    ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, c.width, c.height);  //绘制背景
    var posPlaneNum = {}
    for (var p in parking){
        draw_plane(p);
        if (posPlaneNum[parking[p]] === undefined) {
            posPlaneNum[parking[p]] = 1
        }
        else
            posPlaneNum[parking[p]]++;
    }
    for (var p in posPlaneNum) {
        if (posPlaneNum[p] == 1)
            continue;
        ctx.font = plane_size+"px Verdana";
        ctx.fillText(posPlaneNum[p].toString(),pos[p].x,pos[p].y,plane_size);
    }
    document.getElementById('status').innerHTML = status_html;
    var marquee = document.getElementById('champions');
    var displayColor = {"red":"red","yellow":"orange","blue":"blue","green":"green"};
    marquee.innerHTML = "名人堂";
    if (champions.length >= 1)
        marquee.innerHTML += "<span style='color:"+displayColor[champions[0]]+"'> 冠军:"+playerIcon[champions[0]]+translate[champions[0]]+translate[champions[0]]+"</span>";
    if (champions.length >= 2)
        marquee.innerHTML += "<span style='color:"+displayColor[champions[1]]+"'> 亚军:"+playerIcon[champions[1]]+translate[champions[1]]+translate[champions[1]]+"</span>";
    if (champions.length >= 3)
        marquee.innerHTML += "<span style='color:"+displayColor[champions[2]]+"'> 季军:"+playerIcon[champions[2]]+translate[champions[2]]+translate[champions[2]]+"</span>";
    if (current == "end")
        cellebrate();
}

function animatedUpdateGame(data) {
    isAllowFly = 0;
    var lastParking = JSON.parse(JSON.stringify(parking));
    parking = data["parking"];
    current = data["current"];
    champions = data["champions"];
    if (current == "end")
        status_html = 'Victory！';
    else
        status_html = '当前轮到'+translate[current]+'方';
    if (colour == current) {
        if (hosted)
            status_html += ' <button style="font-size: 50px">托管中</button>';
        else
            status_html += ' <button onclick="send_roll()" style="font-size: 50px">骰子</button>';
    }
    if (hosted && colour == current) {
        ws.send('#HS*'+roomNum);
    }
    animated_draw_planes(lastParking, parking);
    setTimeout(function () {
        ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, c.width, c.height);  //绘制背景
        var posPlaneNum = {}
        for (var p in parking){
            draw_plane(p);
            if (posPlaneNum[parking[p]] === undefined){
                posPlaneNum[parking[p]] = 1
            }
            else
                posPlaneNum[parking[p]]++;
        }
        for (var p in posPlaneNum) {
            if (posPlaneNum[p] == 1)
                continue;
            ctx.font = plane_size+"px Verdana";
            ctx.fillText(posPlaneNum[p].toString(),pos[p].x,pos[p].y,plane_size);
        }
        document.getElementById('status').innerHTML = status_html;
        var marquee = document.getElementById('champions');
        var displayColor = {"red":"red","yellow":"orange","blue":"blue","green":"green"};
        marquee.innerHTML = "名人堂";
        if (champions.length >= 1)
            marquee.innerHTML += "<span style='color:"+displayColor[champions[0]]+"'> 冠军:"+playerIcon[champions[0]]+translate[champions[0]]+translate[champions[0]]+"</span>";
        if (champions.length >= 2)
            marquee.innerHTML += "<span style='color:"+displayColor[champions[1]]+"'> 亚军:"+playerIcon[champions[1]]+translate[champions[1]]+translate[champions[1]]+"</span>";
        if (champions.length >= 3)
            marquee.innerHTML += "<span style='color:"+displayColor[champions[2]]+"'> 季军:"+playerIcon[champions[2]]+translate[champions[2]]+translate[champions[2]]+"</span>";
        if (current == "end")
            cellebrate();
    },(animatedTime / frames) * (frames + 1));
}

function staticUpdateRoll(isAllowMove) {
    if (isAllowMove == 'normal') {
        status_html = '当前轮到' + translate[current] + '方，roll出' + roll + '点';
        document.getElementById('status').innerHTML = status_html;
        if (colour == current)
            isAllowFly = 1;
    }
    else if (isAllowMove == 'nomove'){
        status_html = '当前轮到' + translate[current] + '方，roll出' + roll + '点，等待起飞...';
        document.getElementById('status').innerHTML = status_html;
    }
}

function animatedUpdateRoll(isAllowMove, isHosted) {
    status_html = '当前轮到' + translate[current] + '方 <button style="font-size: 50px">.</button>';
    document.getElementById('status').innerHTML = status_html;

    setTimeout(function () {
        status_html = '当前轮到' + translate[current] + '方 <button style="font-size: 50px">..</button>';
        document.getElementById('status').innerHTML = status_html;
    },animatedTime / 3);

    setTimeout(function () {
        status_html = '当前轮到' + translate[current] + '方 <button style="font-size: 50px">...</button>';
        document.getElementById('status').innerHTML = status_html;
    },animatedTime / 3 * 2);

    setTimeout(function () {
        if (isAllowMove == 'normal') {
            status_html = '当前轮到' + translate[current] + '方，roll出' + roll + '点';
            document.getElementById('status').innerHTML = status_html;
            if (colour == current && isHosted == "normal")
                isAllowFly = 1;
        }
        else if (isAllowMove == 'nomove'){
            status_html = '当前轮到' + translate[current] + '方，roll出' + roll + '点，等待起飞...';
            document.getElementById('status').innerHTML = status_html;
    }
    },animatedTime);
}

function get_pencil (canvas, x, y) {
    var rect = canvas.getBoundingClientRect();
    //x和y参数分别传入的是鼠标距离窗口的坐标，然后减去canvas距离窗口左边和顶部的距离
    return {x: x - rect.left * (canvas.width / rect.width), y: y - rect.top * (canvas.height / rect.height)}
}

onmousedown = function (e) {  //飞行
    if (isAllowFly){
        var {x, y} = get_pencil(c,e.clientX,e.clientY);
        for (var p in parking){
            if (p.slice(0,1) != colour.slice(0,1))
                continue;
            if (Math.hypot(x-pos[parking[p]]['x'], y-pos[parking[p]]['y']) <= plane_size/2+blur_size){
                ws.send('#FY*["'+roomNum+'","'+p+'"]');
                isAllowFly = 0;
                break;
            }
        }
    }
}

window.addEventListener('touchstart', function (e) {
    if (isAllowFly){
        var {x, y} = get_pencil(c,e.touches[0].clientX,e.touches[0].clientY);
        for (var p in parking){
            if (p.slice(0,1) != colour.slice(0,1))
                continue;
            if (Math.hypot(x-pos[parking[p]]['x'], y-pos[parking[p]]['y']) <= plane_size/2+blur_size){
                ws.send('#FY*["'+roomNum+'","'+p+'"]');
                isAllowFly = 0;
                break;
            }
        }
    }
})

function editMessage(send_message) {
    var role = playerIcon[colour]+translate[colour];
    if (colour != 'observe')
        role += translate[colour];
    if (nickName)
        role += "("+nickName+")";
    ws.send("#MG*['" + roomNum + "','" + role + "','" + send_message + "']");
}

function sendMsg(){
    var send_message = document.getElementById('msg').value;
    if (!send_message)
        return;
    if (send_message.slice(0,1) == '/') {
        if (1)
        {
            var his_box = document.getElementById('history');
            his_box.innerHTML = his_box.value + "--系统: 无效的指令。\n";
            his_box.scrollTop = his_box.scrollHeight;
        }
    }
    else {
        editMessage(send_message);
    }
    document.getElementById('msg').value = "";
}

function hosting() {
    //托管
    var his_box = document.getElementById('history');
    if (colour != "observe") {
        hosted = !hosted;
        if (hosted)
        {
            document.getElementById("host").innerHTML = "取消托管";
            his_box.innerHTML = his_box.value + "--系统: 托管将从下次骰子起生效。\n";
            his_box.scrollTop = his_box.scrollHeight;
            editMessage("已托管。");
        }
        else
        {
            document.getElementById("host").innerHTML = "托管";
            his_box.innerHTML = his_box.value + "--系统: 托管已取消，下次骰子起生效。\n";
            his_box.scrollTop = his_box.scrollHeight;
            editMessage("取消托管。");
        }
    }
    else
    {
        his_box.innerHTML = his_box.value + "--系统: 观众不允许托管。\n";
        his_box.scrollTop = his_box.scrollHeight;
    }
}

function playOrStopMusic() {
    music = !music;
    if (music) {
        document.getElementById("mc").style.textDecoration = "none";
        var bgm = document.getElementById("bgm");
        bgm.currentTime = 0;
        bgm.play();
    }
    else {
        document.getElementById("mc").style.textDecoration = "line-through";
        var bgm = document.getElementById("bgm");
        bgm.pause();
    }
}
