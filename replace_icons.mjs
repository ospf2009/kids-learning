// ⚠️ 历史迁移工具（一次性）：把源码里中文 [] 图标替换成 Material Icons。
// 仅在项目从旧图标方案迁移到 Material Icons 时运行过一次，
// 切勿重复运行，否则会再次改写 src/ 下的 .vue / .ts 文件。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, 'src');

// [替换标记] → Material Icons 名称
const iconMap = {
  '书': 'menu_book',      // 语文/书籍
  '数': 'calculate',      // 数学/计算
  '英': 'abc',            // 英语/字母
  '花': '',               // 装饰，移除
  '蓝': 'diamond',        // 菱形
  '虹': '',               // 彩虹
  '冠': 'emoji_events',   // 冠军/奖杯
  '牌': 'military_tech',  // 奖牌
  '钻': 'diamond',        // 钻石
  '满': 'stars',          // 满分
  '靶': 'trackpad_target', // 目标
  '欢': 'celebration',    // 庆祝
  '庆': 'celebration',
  '球': 'balloon',        // 气球
  '礼': 'card_giftcard',  // 礼物
  '灯': 'lightbulb',       // 灯泡/提示
  '写': 'edit_note',       // 写/笔记
  '表': 'bar_chart',       // 图表/统计
  '卷': 'scroll',         // 卷轴
  '箱': 'inbox',          // 收件箱
  '尺': 'straighten',     // 尺子
  '钉': 'push_pin',       // 图钉
  '人': 'person',         // 用户
  '蛙': 'cruelty_free',   // 青蛙
  '猫': 'pets',           // 猫
  '狗': 'pets',           // 狗
  '鱼': 'set_meal',       // 鱼
  '鸟': 'flight',         // 鸟
  '兔': 'pets',           // 兔
  '熊': 'pets',           // 熊
  '苹': 'nutrition',      // 苹果
  '橘': 'nutrition',      // 橘子
  '堡': 'lunch_dining',    // 汉堡
  '叶': 'eco',            // 叶子
  '芽': 'eco',            // 芽
  '晴': 'sunny',          // 晴朗
  '月': 'bedtime',        // 月亮
  '阳': 'sunny',          // 太阳
  '树': 'forest',         // 树
  '草': 'grass',          // 草
  '箭': 'rocket_launch',   // 火箭
  '车': 'directions_car', // 车
  '电': 'bolt',           // 闪电
  '链': 'link',           // 链接
  '锁': 'lock',           // 锁
  '红': 'circle',         // 红
  '蓝': 'circle',         // 蓝
  '绿': 'circle',         // 绿
  '黄': 'circle',         // 黄
  '转': 'sync',           // 同步
  '弹': 'dangerous',      // 炸弹
  '币': 'payments',       // 硬币/钱
  '结': 'ribbon',         // 蝴蝶结
  '衣': 'checkroom',      // 衣服
};

// 收集所有 vue 文件
const vueFiles = [];
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp);
    else if (e.name.endsWith('.vue') || e.name.endsWith('.ts')) vueFiles.push(fp);
  }
}
walk(src);

console.log('Total files:', vueFiles.length);

let total = 0;
for (const file of vueFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let modified = false;
  
  for (const [key, iconName] of Object.entries(iconMap)) {
    const pattern = `[${key}]`;
    while (content.includes(pattern)) {
      if (iconName) {
        // 判断上下文——如果在 double-quoted string 里（如 icon: '[书]'），保留为字符串
        // 如果在 template 里直接显示，替换为 span.icon
        const idx = content.indexOf(pattern);
        // 检查前后文，决定替换策略
        content = content.replace(pattern, iconName);
        total++;
        modified = true;
      } else {
        // 空的，直接删除
        content = content.replace(`[${key}]`, '');
        total++;
        modified = true;
      }
    }
  }
  
  // 第二遍：在 .vue 的 template 中，把 icon 名称包装成 Material Icons span
  // 这只对 .vue 文件生效
  if (file.endsWith('.vue')) {
    const lines = content.split('\n');
    let inTemplate = false;
    const newLines = [];
    for (const line of lines) {
      let newLine = line;
      if (line.includes('<template>')) inTemplate = true;
      
      if (inTemplate && !line.includes('<script')) {
        // 在 template 中的普通文本 icon name → 替换为 Material Icons span
        // 跳过已经在 {{ }} 插值或 v-bind 里的
        // 简单策略：替换 {{ }} 之外出现的 icon 名称
        for (const [key, iconName] of Object.entries(iconMap)) {
          if (!iconName) continue;
          // 如果这一行有 icon 名称作为独立文本出现
          // 注意：在字符串赋值里的不要动，比如 icon: 'menu_book'
          const regex = new RegExp(`(?<![\\w'\"/])${iconName}(?![\\w'\"<>&;])`, 'g');
          newLine = newLine.replace(regex, (match) => {
            return `<span class="icon">${match}</span>`;
          });
        }
      }
      
      if (line.includes('</template>')) inTemplate = false;
      newLines.push(newLine);
    }
    content = newLines.join('\n');
  }
  
  if (modified) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log('  Modified:', path.relative(src, file));
  }
}

console.log('Total replacements:', total);
console.log('Done!');
