// [数] 数学学习数据 - 一年级下册
export interface MathLesson {
  id: string
  title: string
  type: 'count' | 'add' | 'subtract' | 'compare' | 'shape' | 'time' | 'timed' | 'drag'
  icon: string
  description: string
  gameMode: 'choice' | 'timed' | 'drag' | 'compare' | 'shape'
  items: MathItem[]
}

export interface MathItem {
  id: string
  question: string
  answer: number | string
  options?: (number | string)[]
  hint?: string
  dragItems?: DragItem[] // 拖拽用
  shapeType?: string
}

export interface DragItem {
  id: string
  emoji: string
  count: number
}

export const mathLessons: MathLesson[] = [
  {
    id: 'add-1',
    title: '加法小火车',
    type: 'add',
    icon: '[T]',
    description: '数字手拉手，越来越大啦',
    gameMode: 'choice',
    items: [
      { id: 'a1', question: '3 + 2 = ?', answer: 5, options: [4, 5, 6, 7], hint: '伸出3个手指，再伸2个' },
      { id: 'a2', question: '4 + 4 = ?', answer: 8, options: [6, 7, 8, 9], hint: '两堆各4个糖果' },
      { id: 'a3', question: '5 + 3 = ?', answer: 8, options: [7, 8, 9, 10], hint: '先拿5个，再拿3个' },
      { id: 'a4', question: '6 + 2 = ?', answer: 8, options: [7, 8, 9, 10], hint: '6个苹果再加2个' },
      { id: 'a5', question: '7 + 3 = ?', answer: 10, options: [8, 9, 10, 11], hint: '凑十法！7+3=10' },
    ]
  },
  {
    id: 'sub-1',
    title: '减法滑滑梯',
    type: 'subtract',
    icon: '[R]',
    description: '数字往下滑，越来越小啦',
    gameMode: 'choice',
    items: [
      { id: 's1', question: '5 - 2 = ?', answer: 3, options: [2, 3, 4, 5], hint: '5个糖吃掉2个' },
      { id: 's2', question: '8 - 3 = ?', answer: 5, options: [4, 5, 6, 7], hint: '8个气球飞走3个' },
      { id: 's3', question: '9 - 4 = ?', answer: 5, options: [4, 5, 6, 7], hint: '9朵花送走4朵' },
      { id: 's4', question: '10 - 6 = ?', answer: 4, options: [3, 4, 5, 6], hint: '10颗星星灭了6颗' },
      { id: 's5', question: '7 - 5 = ?', answer: 2, options: [1, 2, 3, 4], hint: '7只小鸟飞走5只' },
    ]
  },
  {
    id: 'timed-1',
    title: '口算大闯关',
    type: 'timed',
    icon: '~',
    description: '60秒限时挑战，看谁算得快',
    gameMode: 'timed',
    items: [
      { id: 't1', question: '2 + 3 = ?', answer: 5, options: [4, 5, 6, 7] },
      { id: 't2', question: '6 - 1 = ?', answer: 5, options: [4, 5, 6, 7] },
      { id: 't3', question: '4 + 2 = ?', answer: 6, options: [5, 6, 7, 8] },
      { id: 't4', question: '9 - 3 = ?', answer: 6, options: [5, 6, 7, 8] },
      { id: 't5', question: '3 + 4 = ?', answer: 7, options: [5, 6, 7, 8] },
      { id: 't6', question: '8 - 2 = ?', answer: 6, options: [5, 6, 7, 8] },
      { id: 't7', question: '5 + 5 = ?', answer: 10, options: [8, 9, 10, 11] },
      { id: 't8', question: '7 - 4 = ?', answer: 3, options: [2, 3, 4, 5] },
      { id: 't9', question: '1 + 8 = ?', answer: 9, options: [7, 8, 9, 10] },
      { id: 't10', question: '10 - 7 = ?', answer: 3, options: [2, 3, 4, 5] },
    ]
  },
  {
    id: 'drag-1',
    title: '数数小能手',
    type: 'drag',
    icon: '[A]',
    description: '拖拽苹果来数数，数对了就过关',
    gameMode: 'drag',
    items: [
      { id: 'd1', question: '数一数，有几个苹果？', answer: 3, dragItems: [{ id: 'apple', emoji: '[A]', count: 3 }], hint: '一个一个数' },
      { id: 'd2', question: '数一数，有几个星星？', answer: 5, dragItems: [{ id: 'star', emoji: '*', count: 5 }], hint: '数数看' },
      { id: 'd3', question: '数一数，有几个爱心？', answer: 4, dragItems: [{ id: 'heart', emoji: '<3', count: 4 }], hint: '一个一个数' },
      { id: 'd4', question: '苹果和橘子一共有几个？', answer: 6, dragItems: [{ id: 'apple', emoji: '[A]', count: 3 }, { id: 'orange', emoji: '[O]', count: 3 }], hint: '先数苹果，再数橘子' },
      { id: 'd5', question: '兔子和小猫一共有几只？', answer: 7, dragItems: [{ id: 'rabbit', emoji: '[R]', count: 4 }, { id: 'cat', emoji: '[C]', count: 3 }], hint: '加在一起数' },
    ]
  },
  {
    id: 'compare-1',
    title: '大小比一比',
    type: 'compare',
    icon: '⚖️',
    description: '谁大谁小？比一比就知道',
    gameMode: 'compare',
    items: [
      { id: 'cp1', question: '5 和 3，谁大？', answer: '5', options: ['5', '3', '一样大'], hint: '数一数，5个比3个多' },
      { id: 'cp2', question: '8 和 10，谁小？', answer: '8', options: ['8', '10', '一样大'], hint: '8在10的前面' },
      { id: 'cp3', question: '6 + 2 和 7，谁大？', answer: '6+2', options: ['6+2', '7', '一样大'], hint: '先算6+2等于几' },
      { id: 'cp4', question: '9 - 3 和 5，谁小？', answer: '9-3', options: ['9-3', '5', '一样大'], hint: '先算9-3等于几' },
    ]
  },
  {
    id: 'shape-1',
    title: '图形乐园',
    type: 'shape',
    icon: '♦',
    description: '认识有趣的图形朋友',
    gameMode: 'shape',
    items: [
      { id: 'sh1', question: '圆形有几个角？', answer: '0', options: ['0', '1', '3', '4'], hint: '圆圆的，没有角', shapeType: 'circle' },
      { id: 'sh2', question: '三角形有几条边？', answer: '3', options: ['2', '3', '4', '5'], hint: '三角形，三条边', shapeType: 'triangle' },
      { id: 'sh3', question: '正方形有几条边？', answer: '4', options: ['3', '4', '5', '6'], hint: '正正方方，四条边一样长', shapeType: 'square' },
      { id: 'sh4', question: '长方形有几个角？', answer: '4', options: ['2', '3', '4', '6'], hint: '和正方形一样有4个角', shapeType: 'rectangle' },
    ]
  },
  {
    id: 'time-1',
    title: '时间小达人',
    type: 'time',
    icon: '1',
    description: '认识钟表，做时间的小主人',
    gameMode: 'choice',
    items: [
      { id: 'tm1', question: '钟表上有几个数字？', answer: '12', options: ['10', '11', '12', '24'], hint: '从1数到12' },
      { id: 'tm2', question: '分针走一圈是多久？', answer: '1小时', options: ['1分钟', '1小时', '1天', '1周'], hint: '分针走一圈，时针走一格' },
      { id: 'tm3', question: '3:00时，时针指向几？', answer: '3', options: ['2', '3', '6', '12'], hint: '几点就指向几' },
    ]
  },

  // ===== 二年级上册 - 数学 =====
  // 第1单元：长度单位
  {
    id: 'g2m-u1',
    title: '长度单位',
    type: 'add',
    icon: '[测]',
    description: '认识厘米和米，学会测量长度',
    gameMode: 'choice',
    items: [
      { id: 'g2m-u1-1', question: '量比较短的物体，用什么作单位？', answer: '厘米', options: ['厘米', '米', '千米', '分米'], hint: '用尺子量铅笔' },
      { id: 'g2m-u1-2', question: '1米等于多少厘米？', answer: '100', options: ['10', '100', '50', '1000'], hint: '米和厘米的进率' },
      { id: 'g2m-u1-3', question: '教室的门高约2什么？', answer: '米', options: ['厘米', '米', '分米', '千米'], hint: '想一想门有多高' },
      { id: 'g2m-u1-4', question: '课桌高约70什么？', answer: '厘米', options: ['厘米', '米', '分米', '千米'], hint: '课桌到你的腰那么高' },
      { id: 'g2m-u1-5', question: '下面哪个长度最长？', answer: '1米', options: ['90厘米', '1米', '80厘米', '50厘米'], hint: '先统一单位再比较' },
      { id: 'g2m-u1-6', question: '3米等于多少厘米？', answer: '300', options: ['30', '300', '3000', '3'], hint: '1米=100厘米' },
      { id: 'g2m-u1-7', question: '一根铅笔长约18什么？', answer: '厘米', options: ['厘米', '米', '分米', '千米'], hint: '铅笔没那么长' },
      { id: 'g2m-u1-8', question: '1米和98厘米谁大？', answer: '1米', options: ['1米', '98厘米', '一样大', '无法比较'], hint: '1米=100厘米' },
      { id: 'g2m-u1-9', question: '小明的身高是1米20厘米，还可以写成什么？', answer: '120厘米', options: ['120厘米', '12厘米', '102厘米', '20厘米'], hint: '1米=100厘米' },
      { id: 'g2m-u1-10', question: '下面哪个单位适合量教室的长度？', answer: '米', options: ['厘米', '米', '毫米', '分米'], hint: '教室比较长' },
    ]
  },
  // 第2单元：100以内的加法和减法（二）
  {
    id: 'g2m-u2',
    title: '100以内的加法和减法(二)',
    type: 'add',
    icon: '[算]',
    description: '两位数加减两位数，进位退位',
    gameMode: 'choice',
    items: [
      { id: 'g2m-u2-1', question: '36 + 25 = ?', answer: '61', options: ['51', '61', '71', '55'], hint: '个位6+5=11，进1' },
      { id: 'g2m-u2-2', question: '48 + 37 = ?', answer: '85', options: ['75', '85', '95', '78'], hint: '个位8+7=15，进1' },
      { id: 'g2m-u2-3', question: '72 - 38 = ?', answer: '34', options: ['44', '34', '24', '36'], hint: '个位2不够减8，借1' },
      { id: 'g2m-u2-4', question: '80 - 45 = ?', answer: '35', options: ['45', '35', '25', '55'], hint: '0减5不够，向十位借' },
      { id: 'g2m-u2-5', question: '53 + 29 = ?', answer: '82', options: ['72', '82', '92', '78'], hint: '个位3+9=12，进1' },
      { id: 'g2m-u2-6', question: '64 - 27 = ?', answer: '37', options: ['47', '37', '27', '41'], hint: '4不够减7，借1' },
      { id: 'g2m-u2-7', question: '56 + 38 = ?', answer: '94', options: ['84', '94', '88', '96'], hint: '个位6+8=14，进1' },
      { id: 'g2m-u2-8', question: '90 - 56 = ?', answer: '34', options: ['44', '34', '24', '36'], hint: '0减6不够，借1' },
      { id: 'g2m-u2-9', question: '在竖式计算中，相同数位要怎样？', answer: '对齐', options: ['对齐', '分开', '随便', '不对齐'], hint: '个位对个位，十位对十位' },
      { id: 'g2m-u2-10', question: '一本书38元，一个文具盒26元，一共多少钱？', answer: '64元', options: ['54元', '64元', '74元', '60元'], hint: '38+26=?' },
    ]
  },
  // 第3单元：角的初步认识
  {
    id: 'g2m-u3',
    title: '角的初步认识',
    type: 'shape',
    icon: '[角]',
    description: '认识角、直角、锐角、钝角',
    gameMode: 'choice',
    items: [
      { id: 'g2m-u3-1', question: '一个角有几个顶点？', answer: '1个', options: ['0个', '1个', '2个', '3个'], hint: '角尖的地方就是顶点' },
      { id: 'g2m-u3-2', question: '一个角有几条边？', answer: '2条', options: ['1条', '2条', '3条', '4条'], hint: '从顶点出发的两条线' },
      { id: 'g2m-u3-3', question: '三角尺上有一个什么角？', answer: '直角', options: ['直角', '锐角', '钝角', '平角'], hint: '尺子上的方角' },
      { id: 'g2m-u3-4', question: '比直角小的角叫什么？', answer: '锐角', options: ['锐角', '钝角', '直角', '平角'], hint: '尖尖的，比直角小' },
      { id: 'g2m-u3-5', question: '比直角大的角叫什么？', answer: '钝角', options: ['锐角', '钝角', '直角', '平角'], hint: '比直角大，但没到直线' },
      { id: 'g2m-u3-6', question: '正方形有几个角？', answer: '4个', options: ['2个', '3个', '4个', '6个'], hint: '数数正方形的角' },
      { id: 'g2m-u3-7', question: '下面哪个是直角？', answer: '三角尺上最大的角', options: ['三角尺上最大的角', '钟表3时整的时针分针', '展开的扇子', '打开的课本角'], hint: '用三角尺比一比' },
      { id: 'g2m-u3-8', question: '三角形有几个角？', answer: '3个', options: ['2个', '3个', '4个', '5个'], hint: '三角有三条边' },
      { id: 'g2m-u3-9', question: '长方形有几个直角？', answer: '4个', options: ['2个', '3个', '4个', '0个'], hint: '长方形的四个角都是直角' },
      { id: 'g2m-u3-10', question: '用一副三角尺拼角，可以拼出什么？', answer: '钝角', options: ['钝角', '锐角', '平角', '直角'], hint: '两个角合在一起' },
    ]
  },
  // 第4单元：表内乘法（一）
  {
    id: 'g2m-u4',
    title: '表内乘法(一)',
    type: 'add',
    icon: '[乘]',
    description: '2~6的乘法口诀',
    gameMode: 'choice',
    items: [
      { id: 'g2m-u4-1', question: '3 x 4 = ?', answer: '12', options: ['7', '12', '9', '14'], hint: '三四十二' },
      { id: 'g2m-u4-2', question: '5 x 3 = ?', answer: '15', options: ['8', '15', '12', '10'], hint: '三五十五' },
      { id: 'g2m-u4-3', question: '2 x 6 = ?', answer: '12', options: ['8', '10', '12', '6'], hint: '二六十二' },
      { id: 'g2m-u4-4', question: '4 x 5 = ?', answer: '20', options: ['9', '20', '16', '25'], hint: '四五二十' },
      { id: 'g2m-u4-5', question: '6 x 2 = ?', answer: '12', options: ['8', '10', '12', '14'], hint: '二六十二' },
      { id: 'g2m-u4-6', question: '3 x 3 = ?', answer: '9', options: ['6', '9', '12', '8'], hint: '三三得九' },
      { id: 'g2m-u4-7', question: '5 x 5 = ?', answer: '25', options: ['10', '20', '25', '15'], hint: '五五二十五' },
      { id: 'g2m-u4-8', question: '4个3相加，乘法算式怎么写？', answer: '4x3', options: ['4+3', '4x3', '3+4', '4-3'], hint: '几个几用乘法' },
      { id: 'g2m-u4-9', question: '2 x 3 表示什么？', answer: '2个3相加', options: ['2个3相加', '3个2相加', '2+3', '2+2+2'], hint: '乘号前后代表什么' },
      { id: 'g2m-u4-10', question: '一只青蛙4条腿，3只青蛙几条腿？', answer: '12条', options: ['7条', '12条', '10条', '8条'], hint: '4+4+4=?' },
    ]
  },
  // 第5单元：观察物体（一）
  {
    id: 'g2m-u5',
    title: '观察物体(一)',
    type: 'shape',
    icon: '[看]',
    description: '从不同角度观察物体',
    gameMode: 'choice',
    items: [
      { id: 'g2m-u5-1', question: '从正面看一个长方体，看到的是什么形状？', answer: '长方形', options: ['长方形', '正方形', '圆形', '三角形'], hint: '正面看是什么形' },
      { id: 'g2m-u5-2', question: '从上面看一个圆柱，看到的是什么形状？', answer: '圆形', options: ['长方形', '正方形', '圆形', '三角形'], hint: '从上往下看' },
      { id: 'g2m-u5-3', question: '从不同方向看同一个物体，看到的形状一样吗？', answer: '可能不一样', options: ['一定一样', '可能不一样', '一定不一样', '不确定'], hint: '比如看一个杯子' },
      { id: 'g2m-u5-4', question: '从侧面看一个球，看到的是什么？', answer: '圆形', options: ['圆形', '方形', '三角形', '椭圆形'], hint: '球滚来滚去' },
      { id: 'g2m-u5-5', question: '从正面看一个正方体，看到的是什么？', answer: '正方形', options: ['长方形', '正方形', '圆形', '三角形'], hint: '正方体每个面都一样' },
      { id: 'g2m-u5-6', question: '从上面看一个杯子，看到的是什么？', answer: '圆形', options: ['圆形', '长方形', '三角形', '正方形'], hint: '杯口是什么形状' },
      { id: 'g2m-u5-7', question: '从一个方向观察物体，最多能看到几个面？', answer: '3个面', options: ['1个面', '2个面', '3个面', '4个面'], hint: '拿个盒子看看' },
      { id: 'g2m-u5-8', question: '从左边和右边看同一个物体，看到的一样吗？', answer: '可能不一样', options: ['一定一样', '可能不一样', '一定不一样', '不确定'], hint: '汽车左边和右边' },
      { id: 'g2m-u5-9', question: '从正面看一个圆锥，看到的是什么？', answer: '三角形', options: ['圆形', '正方形', '三角形', '长方形'], hint: '圆锥侧面看像三角形' },
      { id: 'g2m-u5-10', question: '哪个说法是正确的？', answer: '不同位置看物体结果不同', options: ['不同位置看物体结果不同', '任何位置看都一样', '只看正面就够了', '侧面看不到东西'], hint: '观察物体的方法' },
    ]
  },
  // 第6单元：表内乘法（二）
  {
    id: 'g2m-u6',
    title: '表内乘法(二)',
    type: 'add',
    icon: '[乘]',
    description: '7、8、9的乘法口诀',
    gameMode: 'choice',
    items: [
      { id: 'g2m-u6-1', question: '7 x 8 = ?', answer: '56', options: ['48', '56', '64', '72'], hint: '七八五十六' },
      { id: 'g2m-u6-2', question: '8 x 9 = ?', answer: '72', options: ['64', '72', '81', '56'], hint: '八九七十二' },
      { id: 'g2m-u6-3', question: '9 x 9 = ?', answer: '81', options: ['72', '81', '90', '64'], hint: '九九八十一' },
      { id: 'g2m-u6-4', question: '7 x 7 = ?', answer: '49', options: ['42', '49', '56', '63'], hint: '七七四十九' },
      { id: 'g2m-u6-5', question: '6 x 9 = ?', answer: '54', options: ['48', '54', '63', '45'], hint: '六九五十四' },
      { id: 'g2m-u6-6', question: '8 x 8 = ?', answer: '64', options: ['56', '64', '72', '48'], hint: '八八六十四' },
      { id: 'g2m-u6-7', question: '7 x 9 = ?', answer: '63', options: ['56', '63', '72', '54'], hint: '七九六十三' },
      { id: 'g2m-u6-8', question: '一个星期7天，5个星期多少天？', answer: '35天', options: ['30天', '35天', '40天', '45天'], hint: '7x5=?' },
      { id: 'g2m-u6-9', question: '一箱牛奶8瓶，6箱一共多少瓶？', answer: '48瓶', options: ['40瓶', '48瓶', '56瓶', '42瓶'], hint: '8x6=?' },
      { id: 'g2m-u6-10', question: '一班有9人，每人发7本练习本，一共发多少本？', answer: '63本', options: ['56本', '63本', '72本', '54本'], hint: '9x7=?' },
    ]
  },
  // 第7单元：认识时间
  {
    id: 'g2m-u7',
    title: '认识时间',
    type: 'time',
    icon: '[钟]',
    description: '认识几时几分，时和分的关系',
    gameMode: 'choice',
    items: [
      { id: 'g2m-u7-1', question: '1时等于多少分？', answer: '60分', options: ['30分', '60分', '100分', '12分'], hint: '时钟走一大格' },
      { id: 'g2m-u7-2', question: '分针走一小格是几分钟？', answer: '1分', options: ['1分', '5分', '10分', '60分'], hint: '看钟面小格子' },
      { id: 'g2m-u7-3', question: '分针从3走到6，走了几分钟？', answer: '15分', options: ['3分', '15分', '20分', '30分'], hint: '一大格5分钟' },
      { id: 'g2m-u7-4', question: '时针从2走到3，走了几小时？', answer: '1小时', options: ['1小时', '2小时', '5小时', '10小时'], hint: '时针走一大格' },
      { id: 'g2m-u7-5', question: '分针走一圈，时针走多少？', answer: '1大格', options: ['1小格', '1大格', '半圈', '一圈'], hint: '分针转一圈是一小时' },
      { id: 'g2m-u7-6', question: '4:30的时针指向哪两个数字之间？', answer: '4和5之间', options: ['3和4之间', '4和5之间', '5和6之间', '正好指向4'], hint: '半小时时针在哪' },
      { id: 'g2m-u7-7', question: '12:00时分针指向几？', answer: '12', options: ['6', '12', '1', '3'], hint: '整点时看分针' },
      { id: 'g2m-u7-8', question: '分针指向6，时针走过4，是几时几分？', answer: '4时30分', options: ['4时30分', '4时6分', '6时4分', '4时12分'], hint: '分针指向6是半小时' },
      { id: 'g2m-u7-9', question: '一节课通常多长时间？', answer: '40分', options: ['20分', '40分', '60分', '30分'], hint: '一节数学课的时间' },
      { id: 'g2m-u7-10', question: '8:15时，分针指向几？', answer: '3', options: ['3', '5', '8', '1'], hint: '15分是几大格' },
    ]
  },
  // 第8单元：数学广角——搭配（一）
  {
    id: 'g2m-u8',
    title: '数学广角-搭配(一)',
    type: 'add',
    icon: '[搭]',
    description: '简单的排列组合',
    gameMode: 'choice',
    items: [
      { id: 'g2m-u8-1', question: '用1、2两个数字，可以组成几个不同的两位数？', answer: '2个', options: ['1个', '2个', '3个', '4个'], hint: '12和21' },
      { id: 'g2m-u8-2', question: '用1、2、3三个数字组成两位数，每个数字只能用一次，最多能组成几个？', answer: '6个', options: ['3个', '4个', '6个', '9个'], hint: '12,13,21,23,31,32' },
      { id: 'g2m-u8-3', question: '有3件上衣，2条裤子，一共有几种穿法？', answer: '6种', options: ['3种', '5种', '6种', '8种'], hint: '每件上衣可以搭两条裤子' },
      { id: 'g2m-u8-4', question: '从3个小朋友中选2个去跑步，有几种选法？', answer: '3种', options: ['2种', '3种', '4种', '6种'], hint: '选A和B, A和C, B和C' },
      { id: 'g2m-u8-5', question: '从A、B两个地方到C地，A到C有2条路，B到C有3条路，从A经过C到B有几种走法？', answer: '6种', options: ['5种', '6种', '2种', '3种'], hint: '2x3=?' },
      { id: 'g2m-u8-6', question: '有红、黄两种颜色的气球，送给2个小朋友一人一个，有几种送法？', answer: '2种', options: ['1种', '2种', '3种', '4种'], hint: '可以交换颜色' },
      { id: 'g2m-u8-7', question: '用0、1、2组成两位数，0不能做十位，能组成几个？', answer: '4个', options: ['3个', '4个', '5个', '6个'], hint: '10,12,20,21' },
      { id: 'g2m-u8-8', question: '从1、2、3三个数字中任意选两个求和，有几种可能？', answer: '3种', options: ['2种', '3种', '4种', '6种'], hint: '1+2,1+3,2+3' },
      { id: 'g2m-u8-9', question: '3个人握手，每两人握一次手，一共握几次？', answer: '3次', options: ['2次', '3次', '4次', '6次'], hint: 'A-B, A-C, B-C' },
      { id: 'g2m-u8-10', question: '早餐有2种饮料和3种点心，各选一种有几种搭配？', answer: '6种', options: ['3种', '5种', '6种', '8种'], hint: '2x3=?' },
    ]
  }
]
