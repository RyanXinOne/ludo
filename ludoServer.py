from tornado import ioloop, gen
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler,WebSocketClosedError
from tornado.httpserver import HTTPServer
import json
import random
import time
#解决python3.8 NotImplementedError
import platform
if platform.system() == "Windows":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

#飞行阻挡判断，缩放问题

createRoomHTML = '<h1>房间设置</h1>红方：<select id="red"><option value="none">无</option><option value="player">玩家</option><option value="robot">机器人</option></select><br/>黄方：<select id="yellow"><option value="none">无</option><option value="player">玩家</option><option value="robot">机器人</option></select><br/>蓝方：<select id="blue"><option value="none">无</option><option value="player">玩家</option><option value="robot">机器人</option></select><br/>绿方：<select id="green"><option value="none">无</option><option value="player">玩家</option><option value="robot">机器人</option></select><br/><button onclick="send_roomSetting()">确定</button>'
gameBodyHTML = '<marquee id="champions" style="color:red; border:1px dashed magenta; font-size: 30px;"></marquee><p id="status" style="height:70px;margin:10px;font-size:50px"></p><canvas id="cv"></canvas><div style="position:absolute;display:inline;margin:20px"><button id="mc" onclick="playOrStopMusic()" style="font-size:30px;margin-right:50px">音乐</button> <button id="host" onclick="hosting()" style="font-size:30px">托管</button><br><br><textarea id="history" disabled="disabled" style="background: white; color: black;font-size:30px;width:460px;height:400px"></textarea><br><input placeholder="请输入消息内容" id="msg" type="text" onkeypress="if(event.keyCode==13){sendmsg.click();return false;}" style="font-size:30px;width:380px"/><input id="sendmsg" type="button" value="发送" onclick="sendMsg();" style="font-size:30px"/></div>'
iniParking = {"y1":100,"y2":101,"y3":102,"y4":103,"b1":200,"b2":201,"b3":202,"b4":203,"g1":300,"g2":301,"g3":302,"g4":303,"r1":400,"r2":401,"r3":402,"r4":403}

# 样例 gamerooms = {'房间号'：{'createdBy':xxx,'red':xxx,'yellow':xxx,'blue':xxx,'green':xxx,'observe':[xxx],
# 'gameInfo':{'parking':{xxx},'current':'red','roll':0,'champions':[]}},xxx}
gameRooms = {}
sleepTime = 2
def roll_debug():
    return random.randint(1,6)

def getColorChoiceHTML(gameRoomSetting):
    colorChoiceHTML = '请选择你的角色：<select id="color">'
    if gameRoomSetting['red'] not in ['robot','none']:
        colorChoiceHTML += '<option value="red">🦊红红</option>'
    if gameRoomSetting['yellow'] not in ['robot','none']:
        colorChoiceHTML += '<option value="yellow">🐤黄黄</option>'
    if gameRoomSetting['blue'] not in ['robot','none']:
        colorChoiceHTML += '<option value="blue">🐳蓝蓝</option>'
    if gameRoomSetting['green'] not in ['robot','none']:
        colorChoiceHTML += '<option value="green">🐸绿绿</option>'
    colorChoiceHTML += '<option value="observe">🐼旁观</option></select><br><br>游戏昵称：<input id="nickName" placeholder="可选" onkeypress="if(event.keyCode==13){sendCC.click();return false;}"/><br><br><button id="sendCC" onclick="send_colorChoice()">确定</button>'
    return colorChoiceHTML

def switchPlayer(gameInfo):
    gamingTurn = []
    if 'r1' in gameInfo['parking'].keys():
        if gameInfo['current'] == 'red' or gameInfo['parking']['r1'] != 410 or gameInfo['parking']['r2'] != 410 or gameInfo['parking']['r3'] != 410 or gameInfo['parking']['r4'] != 410:
            gamingTurn.append('red')
    if 'y1' in gameInfo['parking'].keys():
        if gameInfo['current'] == 'yellow' or gameInfo['parking']['y1'] != 110 or gameInfo['parking']['y2'] != 110 or gameInfo['parking']['y3'] != 110 or gameInfo['parking']['y4'] != 110:
            gamingTurn.append('yellow')
    if 'b1' in gameInfo['parking'].keys():
        if gameInfo['current'] == 'blue' or gameInfo['parking']['b1'] != 210 or gameInfo['parking']['b2'] != 210 or gameInfo['parking']['b3'] != 210 or gameInfo['parking']['b4'] != 210:
            gamingTurn.append('blue')
    if 'g1' in gameInfo['parking'].keys():
        if gameInfo['current'] == 'green' or gameInfo['parking']['g1'] != 310 or gameInfo['parking']['g2'] != 310 or gameInfo['parking']['g3'] != 310 or gameInfo['parking']['g4'] != 310:
            gamingTurn.append('green')
    if gameInfo['roll'] != 6 or gameInfo['current'] in gameInfo['champions']:
        gameInfo['current'] = gamingTurn[(gamingTurn.index(gameInfo['current']) + 1) % len(gamingTurn)]
    gameInfo['roll'] = 0
    return gameInfo

def returnHome(gameInfo, plane):
    if plane[0] == 'r':
        homeList = [400,401,402,403]
    elif plane[0] == 'y':
        homeList = [100,101,102,103]
    elif plane[0] == 'b':
        homeList = [200,201,202,203]
    else:
        homeList = [300,301,302,303]

    for p in gameInfo['parking'].keys():
        if plane[0] != p[0]:
            continue
        if gameInfo['parking'][p] in homeList:
            homeList.remove(gameInfo['parking'][p])
    gameInfo['parking'][plane] = homeList[0]
    return gameInfo

def planeCrash(gameInfo, dest, bind_plane_list):
    # 穿行飞撞击判断
    flyTo = gameInfo['parking'][bind_plane_list[0]]
    if gameInfo['current'] == 'red' and flyTo == 4:
        for p in gameInfo['parking'].keys():
            if p[0] == 'b' and gameInfo['parking'][p] == 207:
                gameInfo = returnHome(gameInfo, p)
    elif gameInfo['current'] == 'yellow' and flyTo == 17:
        for p in gameInfo['parking'].keys():
            if p[0] == 'g' and gameInfo['parking'][p] == 307:
                gameInfo = returnHome(gameInfo, p)
    elif gameInfo['current'] == 'blue' and flyTo == 30:
        for p in gameInfo['parking'].keys():
            if p[0] == 'r' and gameInfo['parking'][p] == 407:
                gameInfo = returnHome(gameInfo, p)
    elif gameInfo['current'] == 'green' and flyTo == 43:
        for p in gameInfo['parking'].keys():
            if p[0] == 'y' and gameInfo['parking'][p] == 107:
                gameInfo = returnHome(gameInfo, p)

    for p in gameInfo['parking'].keys():
        if p[0] != bind_plane_list[0][0] and gameInfo['parking'][p] == dest:  #如果目标位置有其他飞机
            gameInfo = returnHome(gameInfo, p)

    for p in bind_plane_list:  #正常飞行
        gameInfo['parking'][p] = dest
    return gameInfo

def planesBlock(gameInfo, start, dest, bind_plane_list):
    for path in range(1,gameInfo['roll']):
        path_dest = (start + path) % 52
        blockPlanesNum = 0
        for p in gameInfo['parking'].keys():
            if p[0] == bind_plane_list[0][0]:
                continue
            if gameInfo['parking'][p] == path_dest:
                blockPlanesNum += 1
        if blockPlanesNum > len(bind_plane_list):  #有阻挡需要回飞
            gameInfo = planeCrash(gameInfo, ((path_dest + 52) - (gameInfo['roll'] - path)) % 52, bind_plane_list)
            return gameInfo
    #无阻挡正常前飞
    gameInfo = planeCrash(gameInfo, dest, bind_plane_list)
    return gameInfo

def jumpAndCorss(gameInfo, bind_plane_list):
    flyTo = gameInfo['parking'][bind_plane_list[0]]
    # 跳格飞判断
    if gameInfo['current'] == 'red' and flyTo in [40, 44, 48, 0, 8, 12, 16, 20, 24, 28, 32]:
        gameInfo = planeCrash(gameInfo, (flyTo + 4) % 52, bind_plane_list)
    elif gameInfo['current'] == 'yellow' and flyTo in [1, 5, 9, 13, 21, 25, 29, 33, 37, 41, 45]:
        gameInfo = planeCrash(gameInfo, (flyTo + 4) % 52, bind_plane_list)
    elif gameInfo['current'] == 'blue' and flyTo in [14, 18, 22, 26, 34, 38, 42, 46, 50, 2, 6]:
        gameInfo = planeCrash(gameInfo, (flyTo + 4) % 52, bind_plane_list)
    elif gameInfo['current'] == 'green' and flyTo in [27, 31, 35, 39, 47, 51, 3, 7, 11, 15, 19]:
        gameInfo = planeCrash(gameInfo, (flyTo + 4) % 52, bind_plane_list)
    flyTo = gameInfo['parking'][bind_plane_list[0]]
    # 穿行飞判断
    if gameInfo['current'] == 'red' and flyTo == 4:
        gameInfo = planeCrash(gameInfo, 16, bind_plane_list)
    elif gameInfo['current'] == 'yellow' and flyTo == 17:
        gameInfo = planeCrash(gameInfo, 29, bind_plane_list)
    elif gameInfo['current'] == 'blue' and flyTo == 30:
        gameInfo = planeCrash(gameInfo, 42, bind_plane_list)
    elif gameInfo['current'] == 'green' and flyTo == 43:
        gameInfo = planeCrash(gameInfo, 3, bind_plane_list)
    return gameInfo

def flyEngine(roomNum, gameInfo,plane):
    ppos = gameInfo['parking'][plane]
    bind_plane_list = []  #合体飞机列表
    for p in gameInfo['parking'].keys():
        if plane[0] != p[0]:
            continue
        if ppos == gameInfo['parking'][p]:
            bind_plane_list.append(p)

    def flyTogether(dest):  #合体飞
        for p in bind_plane_list:
            gameInfo['parking'][p] = dest

    if ppos in [100,101,102,103,200,201,202,203,300,301,302,303,400,401,402,403]:  #若飞机在家
        if gameInfo['roll'] == 6:  #骰到6才能出家门
            if gameInfo['current'] == 'red':
                gameInfo['parking'][plane] = 404
            elif gameInfo['current'] == 'yellow':
                gameInfo['parking'][plane] = 104
            elif gameInfo['current'] == 'blue':
                gameInfo['parking'][plane] = 204
            elif gameInfo['current'] == 'green':
                gameInfo['parking'][plane] = 304
        else:
            return '#FF*'
    elif ppos in [104,204,304,404]:  #飞机在起点位置
        if gameInfo['current'] == 'red':
            gameInfo = planeCrash(gameInfo, 38 + gameInfo['roll'], [plane])
        elif gameInfo['current'] == 'yellow':
            gameInfo = planeCrash(gameInfo, -1 + gameInfo['roll'], [plane])
        elif gameInfo['current'] == 'blue':
            gameInfo = planeCrash(gameInfo, 12 + gameInfo['roll'], [plane])
        elif gameInfo['current'] == 'green':
            gameInfo = planeCrash(gameInfo, 25 + gameInfo['roll'], [plane])
        gameInfo = jumpAndCorss(gameInfo, [plane])
    elif ppos in [105,106,107,108,109,205,206,207,208,209,305,306,307,308,309,405,406,407,408,409]:  #飞机在终点跑道内
        if gameInfo['current'] == 'red':
            flyTo = ppos + gameInfo['roll']
            if flyTo <= 410:
                flyTogether(flyTo)
            else:
                flyTogether(410 - (flyTo - 410))
        elif gameInfo['current'] == 'yellow':
            flyTo = ppos + gameInfo['roll']
            if flyTo <= 110:
                flyTogether(flyTo)
            else:
                flyTogether(110 - (flyTo - 110))
        elif gameInfo['current'] == 'blue':
            flyTo = ppos + gameInfo['roll']
            if flyTo <= 210:
                flyTogether(flyTo)
            else:
                flyTogether(210 - (flyTo - 210))
        elif gameInfo['current'] == 'green':
            flyTo = ppos + gameInfo['roll']
            if flyTo <= 310:
                flyTogether(flyTo)
            else:
                flyTogether(310 - (flyTo - 310))
    elif ppos in [110,210,310,410]:  #终点位置飞机
        return '#FF*'
    else:
        flyTo = ppos + gameInfo['roll']
        if gameInfo['current'] == 'red' and ppos <= 36 and flyTo > 36:  #进终点跑道判断
            flyTogether(404 + flyTo - 36)
        elif gameInfo['current'] == 'yellow' and ppos <= 49 and flyTo > 49:
            flyTogether(104 + flyTo - 49)
        elif gameInfo['current'] == 'blue' and ppos <= 10 and flyTo > 10:
            flyTogether(204 + flyTo - 10)
        elif gameInfo['current'] == 'green' and ppos <= 23 and flyTo > 23:
            flyTogether(304 + flyTo - 23)
        else:
            gameInfo = planeCrash(gameInfo, flyTo % 52, bind_plane_list)
            gameInfo = jumpAndCorss(gameInfo, bind_plane_list)

    def championNotice(champion):
        if len(gameInfo['champions']) == 1:
            send_message = time.asctime(time.localtime(time.time()))[-13:-4] + '恭喜' + champion + '迅捷如风，夺得冠军！\n'
        elif len(gameInfo['champions']) == 2:
            send_message = time.asctime(time.localtime(time.time()))[-13:-4] + '恭喜' + champion + '紧随其后，斩获亚军！\n'
        elif len(gameInfo['champions']) == 3:
            send_message = time.asctime(time.localtime(time.time()))[-13:-4] + '恭喜' + champion + '不甘示弱，取得季军！\n'
        else:
            send_message = time.asctime(time.localtime(time.time()))[-13:-4] + champion + '已全数抵达，再接再厉！\n'
        broardcastInRoom(roomNum, '#MG*' + send_message)

    #某方胜利后加入名人堂
    if gameInfo['current'] == 'red' and gameInfo['parking']['r1'] == 410 and gameInfo['parking']['r2'] == 410 and gameInfo['parking']['r3'] == 410 and gameInfo['parking']['r4'] == 410:
        gameInfo['champions'].append('red')
        championNotice('🦊红红')
    elif gameInfo['current'] == 'yellow' and gameInfo['parking']['y1'] == 110 and gameInfo['parking']['y2'] == 110 and gameInfo['parking']['y3'] == 110 and gameInfo['parking']['y4'] == 110:
        gameInfo['champions'].append('yellow')
        championNotice('🐤黄黄')
    elif gameInfo['current'] == 'blue' and gameInfo['parking']['b1'] == 210 and gameInfo['parking']['b2'] == 210 and gameInfo['parking']['b3'] == 210 and gameInfo['parking']['b4'] == 210:
        gameInfo['champions'].append('blue')
        championNotice('🐳蓝蓝')
    elif gameInfo['current'] == 'green' and gameInfo['parking']['g1'] == 310 and gameInfo['parking']['g2'] == 310 and gameInfo['parking']['g3'] == 310 and gameInfo['parking']['g4'] == 310:
        gameInfo['champions'].append('green')
        championNotice('🐸绿绿')

    for i in gameInfo['parking'].values():  #游戏结束判断
        if i not in [110,210,310,410]:
            break
    else:
        gameInfo['current'] = 'end'
        gameInfo['roll'] = 0
        send_message = time.asctime(time.localtime(time.time()))[-13:-4] + '游戏结束，大吉大利！\n'
        broardcastInRoom(roomNum, '#MG*' + send_message)
        return gameInfo
    gameInfo = switchPlayer(gameInfo)
    return gameInfo

def broardcastInRoom(room, message):
    for i in gameRooms[room]:
        if i == 'gameInfo' or i == 'createdBy':
            continue
        if i == 'observe':
            for j in gameRooms[room][i]:
                try:
                    j.write_message(message)
                except WebSocketClosedError:
                    pass
        elif gameRooms[room][i] != 'none' and gameRooms[room][i] != 'player' and gameRooms[room][i] != 'robot':
            try:
                gameRooms[room][i].write_message(message)
            except WebSocketClosedError:
                pass

@gen.coroutine
def robotTurn(roomNum):
    try:
        while True:
            if gameRooms[roomNum][gameRooms[roomNum]['gameInfo']['current']] != 'robot':
                break
            yield gen.sleep(sleepTime)
            gameRooms[roomNum]['gameInfo']['roll'] = random.randint(1, 6)
            # 判断是否所有飞机都在家或终点
            if gameRooms[roomNum]['gameInfo']['roll'] != 6:
                for i in gameRooms[roomNum]['gameInfo']['parking'].items():
                    if i[0][0] != gameRooms[roomNum]['gameInfo']['current'][0]:
                        continue
                    if (gameRooms[roomNum]['gameInfo']['current'] == 'red' and i[1] not in [400, 401, 402, 403, 410]) or (gameRooms[roomNum]['gameInfo']['current'] == 'yellow' and i[1] not in [100, 101, 102, 103, 110]) or (gameRooms[roomNum]['gameInfo']['current'] == 'blue' and i[1] not in [200, 201, 202, 203, 210]) or (gameRooms[roomNum]['gameInfo']['current'] == 'green' and i[1] not in [300, 301, 302, 303, 310]):
                        break
                else:
                    broardcastInRoom(roomNum, '#RL*' + str(gameRooms[roomNum]['gameInfo']['roll']) + '***nomove***normal')
                    yield gen.sleep(sleepTime)
                    gameRooms[roomNum]['gameInfo'] = switchPlayer(gameRooms[roomNum]['gameInfo'])
                    broardcastInRoom(roomNum, '#FY*' + json.dumps(gameRooms[roomNum]['gameInfo']))
                    continue
            broardcastInRoom(roomNum, '#RL*' + str(gameRooms[roomNum]['gameInfo']['roll']) + '***normal***normal')
            yield gen.sleep(sleepTime)
            while True:
                p = gameRooms[roomNum]['gameInfo']['current'][0]+str(random.randint(1,4))
                if p not in gameRooms[roomNum]['gameInfo']['parking'].keys():
                    continue
                flyRes = flyEngine(roomNum, gameRooms[roomNum]['gameInfo'], p)
                if flyRes == '#FF*':
                    continue
                else:
                    gameRooms[roomNum]['gameInfo'] = flyRes
                    broardcastInRoom(roomNum, '#FY*' + json.dumps(gameRooms[roomNum]['gameInfo']))
                    if gameRooms[roomNum]['gameInfo']['current'] == 'end':
                        return
                    break
    except KeyError:
        pass


class index_handler(RequestHandler):
    def get(self):
        self.render('index.html')


class ws_handler(WebSocketHandler):
    @gen.coroutine
    def on_message(self, message):
        try:
            if message.startswith('#RN*'):  #RoomNumber
                message = message[4:]
                if message in gameRooms.keys(): #加入房间
                    self.write_message('#CC*' + getColorChoiceHTML(gameRooms[message]))
                else: #创建房间
                    self.write_message('#CR*'+createRoomHTML)
            elif message.startswith('#RS*'):  #RoomSetting
                message = json.loads(message[4:])
                if message[0] not in gameRooms.keys():
                    gameRooms[message[0]] = message[1]
                    parking = {}
                    if message[1]['green'] != 'none':
                        current = 'green'
                        parking['g1'] = iniParking['g1']
                        parking['g2'] = iniParking['g2']
                        parking['g3'] = iniParking['g3']
                        parking['g4'] = iniParking['g4']
                    if message[1]['blue'] != 'none':
                        current = 'blue'
                        parking['b1'] = iniParking['b1']
                        parking['b2'] = iniParking['b2']
                        parking['b3'] = iniParking['b3']
                        parking['b4'] = iniParking['b4']
                    if message[1]['yellow'] != 'none':
                        current = 'yellow'
                        parking['y1'] = iniParking['y1']
                        parking['y2'] = iniParking['y2']
                        parking['y3'] = iniParking['y3']
                        parking['y4'] = iniParking['y4']
                    if message[1]['red'] != 'none':
                        current = 'red'
                        parking['r1'] = iniParking['r1']
                        parking['r2'] = iniParking['r2']
                        parking['r3'] = iniParking['r3']
                        parking['r4'] = iniParking['r4']
                    gameRooms[message[0]]['createdBy'] = self
                    gameRooms[message[0]]['gameInfo'] = {'parking':parking,'current':current,'roll':0,'champions':[]}
                    self.write_message('#CC*'+getColorChoiceHTML(gameRooms[message[0]]))
                    print(time.asctime(time.localtime(time.time())),list(gameRooms.keys()))
                    robotTurn(message[0])
                else:
                    self.write_message('#RE*')
            elif message.startswith('#CC*'):  #colorChoice
                message = json.loads(message[4:])
                if message[0] not in gameRooms:
                    self.write_message('#RM*')
                    return
                if message[1] != 'observe':
                    if gameRooms[message[0]][message[1]] == 'player':
                        gameRooms[message[0]][message[1]] = self
                        #判断是否所有飞机都在家或终点
                        if gameRooms[message[0]]['gameInfo']['roll'] != 6:
                            for i in gameRooms[message[0]]['gameInfo']['parking'].items():
                                if i[0][0] != gameRooms[message[0]]['gameInfo']['current'][0]:
                                    continue
                                if (gameRooms[message[0]]['gameInfo']['current'] == 'red' and i[1] not in [400,401,402,403,410]) or (gameRooms[message[0]]['gameInfo']['current'] == 'yellow' and i[1] not in [100,101,102,103,110]) or (gameRooms[message[0]]['gameInfo']['current'] == 'blue' and i[1] not in [200,201,202,203,210]) or (gameRooms[message[0]]['gameInfo']['current'] == 'green' and i[1] not in [300,301,302,303,310]):
                                    break
                            else:
                                self.write_message('#SG*'+gameBodyHTML+'***'+json.dumps(gameRooms[message[0]]['gameInfo'])+'***nomove')
                                return
                        self.write_message('#SG*'+gameBodyHTML+'***'+json.dumps(gameRooms[message[0]]['gameInfo'])+'***normal')
                    else:
                        self.write_message('#CF*')
                        return
                else:  #观战
                    gameRooms[message[0]][message[1]].append(self)
                    #判断是否所有飞机都在家或终点
                    if gameRooms[message[0]]['gameInfo']['roll'] != 6:
                        for i in gameRooms[message[0]]['gameInfo']['parking'].items():
                            if i[0][0] != gameRooms[message[0]]['gameInfo']['current'][0]:
                                continue
                            if (gameRooms[message[0]]['gameInfo']['current'] == 'red' and i[1] not in [400,401,402,403,410]) or (gameRooms[message[0]]['gameInfo']['current'] == 'yellow' and i[1] not in [100,101,102,103,110]) or (gameRooms[message[0]]['gameInfo']['current'] == 'blue' and i[1] not in [200,201,202,203,210]) or (gameRooms[message[0]]['gameInfo']['current'] == 'green' and i[1] not in [300,301,302,303,310]):
                                break
                        else:
                            self.write_message('#SG*'+gameBodyHTML+'***'+json.dumps(gameRooms[message[0]]['gameInfo'])+'***nomove')
                            return
                    self.write_message('#SG*'+gameBodyHTML+'***'+json.dumps(gameRooms[message[0]]['gameInfo'])+'***normal')
            elif message.startswith('#SG*'):  #startGame
                message = message[4:]
                setting = []
                for i in ['red','yellow','blue','green']:
                    if gameRooms[message][i] == 'none':
                        setting.append('无')
                    elif gameRooms[message][i] == 'robot':
                        setting.append('机器人')
                    else:
                        setting.append('玩家')
                send_message = time.asctime(time.localtime(time.time()))[-13:-4] + '欢迎加入无聊的飞行棋<'+message+'>房间，房间设置：红方->'+setting[0]+'，黄方->'+setting[1]+'，蓝方->'+setting[2]+'，绿方->'+setting[3]+'。WISH YOU A HAPPY LUDO!\n';
                self.write_message('#MG*' + send_message)
            elif message.startswith('#RL*'):  #roll
                roomNum = message[4:]
                if gameRooms[roomNum]['gameInfo']['roll']:  #防止重复Roll
                    return
                gameRooms[roomNum]['gameInfo']['roll'] = roll_debug()
                #判断是否所有飞机都在家或终点
                if gameRooms[roomNum]['gameInfo']['roll'] != 6:
                    for i in gameRooms[roomNum]['gameInfo']['parking'].items():
                        if i[0][0] != gameRooms[roomNum]['gameInfo']['current'][0]:
                            continue
                        if (gameRooms[roomNum]['gameInfo']['current'] == 'red' and i[1] not in [400,401,402,403,410]) or (gameRooms[roomNum]['gameInfo']['current'] == 'yellow' and i[1] not in [100,101,102,103,110]) or (gameRooms[roomNum]['gameInfo']['current'] == 'blue' and i[1] not in [200,201,202,203,210]) or (gameRooms[roomNum]['gameInfo']['current'] == 'green' and i[1] not in [300,301,302,303,310]):
                            break
                    else:
                        broardcastInRoom(roomNum, '#RL*'+str(gameRooms[roomNum]['gameInfo']['roll'])+'***nomove***normal')
                        yield gen.sleep(sleepTime)
                        try:
                            gameRooms[roomNum]['gameInfo'] = switchPlayer(gameRooms[roomNum]['gameInfo'])
                            broardcastInRoom(roomNum, '#FY*'+json.dumps(gameRooms[roomNum]['gameInfo']))
                            robotTurn(roomNum)
                        except KeyError:
                            pass
                        return
                broardcastInRoom(roomNum, '#RL*'+str(gameRooms[roomNum]['gameInfo']['roll'])+'***normal***normal')
            elif message.startswith('#FY*'):  #fly
                message = eval(message[4:])
                if message[1][0] != gameRooms[message[0]]['gameInfo']["current"][0] or gameRooms[message[0]]['gameInfo']["roll"] == 0:  # 保险措施，理论上判断永不生效
                    return
                flyRes = flyEngine(message[0], gameRooms[message[0]]['gameInfo'], message[1])
                if flyRes == '#FF*':
                    self.write_message('#FF*')
                else:
                    gameRooms[message[0]]['gameInfo'] = flyRes
                    broardcastInRoom(message[0], '#FY*'+json.dumps(gameRooms[message[0]]['gameInfo']))
                    if gameRooms[message[0]]['gameInfo']['current'] == 'end':
                        return
                    robotTurn(message[0])
            elif message.startswith('#MG*'):  #message
                message = eval(message[4:])
                send_message = time.asctime(time.localtime(time.time()))[-13:-4] + message[1] + ': ' + message[2] + '\n'
                broardcastInRoom(message[0],'#MG*'+send_message)
            elif message.startswith('#HS*'):  #hosted
                roomNum = message[4:]
                if gameRooms[roomNum]['gameInfo']['roll']:  #只能在ROLL之前开始托管流程
                    return
                try:
                    yield gen.sleep(sleepTime)
                    gameRooms[roomNum]['gameInfo']['roll'] = random.randint(1, 6)
                    # 判断是否所有飞机都在家或终点
                    if gameRooms[roomNum]['gameInfo']['roll'] != 6:
                        for i in gameRooms[roomNum]['gameInfo']['parking'].items():
                            if i[0][0] != gameRooms[roomNum]['gameInfo']['current'][0]:
                                continue
                            if (gameRooms[roomNum]['gameInfo']['current'] == 'red' and i[1] not in [400, 401, 402, 403, 410]) or (gameRooms[roomNum]['gameInfo']['current'] == 'yellow' and i[1] not in [100, 101, 102, 103, 110]) or (gameRooms[roomNum]['gameInfo']['current'] == 'blue' and i[1] not in [200, 201, 202, 203, 210]) or (gameRooms[roomNum]['gameInfo']['current'] == 'green' and i[1] not in [300, 301, 302, 303, 310]):
                                break
                        else:
                            broardcastInRoom(roomNum,'#RL*' + str(gameRooms[roomNum]['gameInfo']['roll']) + '***nomove***hosted')
                            yield gen.sleep(sleepTime)
                            gameRooms[roomNum]['gameInfo'] = switchPlayer(gameRooms[roomNum]['gameInfo'])
                            broardcastInRoom(roomNum, '#FY*' + json.dumps(gameRooms[roomNum]['gameInfo']))
                            robotTurn(roomNum)
                            return
                    broardcastInRoom(roomNum, '#RL*' + str(gameRooms[roomNum]['gameInfo']['roll']) + '***normal***hosted')
                    yield gen.sleep(sleepTime)
                    while True:
                        p = gameRooms[roomNum]['gameInfo']['current'][0] + str(random.randint(1, 4))
                        if p not in gameRooms[roomNum]['gameInfo']['parking'].keys():
                            continue
                        flyRes = flyEngine(roomNum, gameRooms[roomNum]['gameInfo'], p)
                        if flyRes == '#FF*':
                            continue
                        else:
                            break
                    gameRooms[roomNum]['gameInfo'] = flyRes
                    broardcastInRoom(roomNum, '#FY*' + json.dumps(gameRooms[roomNum]['gameInfo']))
                    if gameRooms[roomNum]['gameInfo']['current'] == 'end':
                        return
                    robotTurn(roomNum)
                except KeyError:
                    pass
        except:
            pass


    def on_close(self):
        isInRoom = False
        for i in gameRooms.keys():
            for j in gameRooms[i].keys():  #玩家退出房间
                if j == 'gameInfo' or j == 'createdBy':
                    continue
                elif j == 'observe':
                    if self in gameRooms[i][j]:
                        gameRooms[i][j].remove(self)
                        isInRoom = True
                        break
                elif gameRooms[i][j] is self:
                    gameRooms[i][j] = 'player'
                    isInRoom = True
                    break
            if isInRoom or gameRooms[i]['createdBy'] is self:
                for j in gameRooms[i].keys():  #清理空房间
                    if j == 'gameInfo' or j == 'createdBy':
                        continue
                    elif j == 'observe':
                        if gameRooms[i][j]:
                            break
                    elif gameRooms[i][j] != 'player' and gameRooms[i][j] != 'robot' and gameRooms[i][j] != 'none':
                        break
                else:
                    gameRooms.pop(i)
                    print(time.asctime(time.localtime(time.time())),list(gameRooms.keys()))
                    break
            if isInRoom:
                break



app = Application([(r"/", index_handler),
                    (r"/ws", ws_handler)],
                static_path="statics",
                template_path="templates",
                websocket_ping_interval=10,
                websocket_ping_timeout=30)

http_server = HTTPServer(app)
http_server.listen(4399)
ioloop.IOLoop.current().start()
