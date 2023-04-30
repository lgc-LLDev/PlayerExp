<!-- markdownlint-disable MD033 -->

# PlayerExp

另一套独立的玩家经验与等级系统

文档：**New Bing** | 润色 ~~加料~~：**student_2333**

## 前言

这是一个玩家经验与等级系统的插件，它可以让玩家通过不同的方式获得经验值，并且根据经验值提升等级，每次升级都会获得一些奖励。这个插件是用 JavaScript 编写的，需要在 LiteLoader 环境下运行。

## 项目简介

PlayerExp 是一个玩家经验与等级系统的插件，它可以让玩家通过不同的方式获得经验值，并且根据经验值提升等级，每次升级都会获得一些奖励。这个插件的特点有：

- 支持多种经验来源，包括登录、破坏方块、放置方块、击杀生物等。
- 支持自定义经验值公式，可以根据玩家的等级计算出每个等级所需的经验值。
- 支持自定义奖励，可以根据玩家的等级或者其他条件给予不同的奖励，包括物品、金钱、积分、命令等。
- 支持 PAPI (BEPlaceHolderAPI) 变量，可以在其他插件中使用玩家的经验和等级信息。
- 支持声音效果，可以在玩家获得经验或者升级时播放不同的声音。

## 图片展示

![Alt text](https://raw.githubusercontent.com/lgc-LLSEDev/readme/main/PlayerExp/QQ%E6%88%AA%E5%9B%BE20230501010710.png)
![Alt text](https://raw.githubusercontent.com/lgc-LLSEDev/readme/main/PlayerExp/QQ%E6%88%AA%E5%9B%BE20230501010733.png)

## 安装方法

请按照下面的方法来安装插件

安装完成后，你需要重启服务器，然后插件就会自动生成配置文件和数据文件。你可以根据自己的需求修改配置文件，然后再次重启服务器，让配置生效。

### 使用 Lip

```shell
lip i github.com/lgc-LLSEDev/PlayerExp
```

### 手动安装

直接下载 `PlayerExp.js` 拖进 BDS 的 plugins 文件夹即可

## 配置文件说明

配置文件的路径是 `plugins/PlayerExp/config.json`，它是一个 `JSON` 格式的文件，它包含了以下的内容：

Tip：实际的配置文件不能包含注释！

```jsonc
{
  // js 表达式，用于计算每个等级所需的经验值，可以用 lvl 代表玩家当前等级
  // 可以使用 js 内置函数、类等
  //
  // 注：玩家的经验值是累积计算的，升级时不会清零
  // 所以这个示例代表需要 500 经验才能升一级，且每升 20 级，每级需要的经验会多 500
  // (1~20 级：500 经验/级 | 20~40 级：1000 经验/级 | 以此类推...)
  "lvlExpFormula": "(lvl - 1) * 500 + Math.floor(lvl / 20) * 500",

  // 获取经验时播放的声音，可以整个删掉，代表不播放声音
  "getExpSound": {
    // 声音的名称
    "name": "random.orb",

    // 声音的音量，可以是一个固定值或一个区间（[最小值, 最大值]），取值为 0 ~ 1
    // 可以不写，默认为 1
    "volume": 0.3,

    // 声音的音调，可以是一个固定值或一个区间（[最小值, 最大值]），取值为 0 ~ 2
    // 可以不写，默认为 1
    "pitch": [0.8, 1.2]
  },

  // 升级时播放的声音，可以整个删掉，参数同上
  "levelUpSound": {
    "name": "random.levelup"
  },

  // 经验来源的配置数组
  "source": [
    // type=login 每日登录
    {
      "type": "login",

      // 获取的经验值
      // 可以指定随机获取的经验区间
      "exp": [100, 500]
    },

    // type=mine 破坏方块
    {
      "type": "mine",

      // 获取的经验值
      // 也可以直接写固定值
      "exp": 3,

      // 破坏这些方块以获得经验
      "value": [
        // 直接使用 string，代表仅匹配方块类型名
        "minecraft:wood",
        "minecraft:mangrove_wood",
        "minecraft:crimson_hyphae",
        "minecraft:warped_hyphae"
      ]
    },
    {
      // 同上
      "type": "mine",
      "exp": [5, 10],

      // 可以使用一个 [string, number] 的数组指定方块的数据值
      "value": [
        // 数据值为 7 的小麦 代表成熟的小麦
        ["minecraft:wheat", 7],

        // 代表成熟的土豆
        ["minecraft:potatoes", 3]
      ]
    },
    {
      // 同上
      "type": "mine",
      "exp": [25, 50],
      "value": ["minecraft:diamond_ore", "minecraft:emerald_ore"],

      // 是否忽略精准采集附魔
      // 如果为 true，则只有没有精准采集附魔的工具才能获得经验
      // 可以不写，默认为 `false`
      "ignoreSilkTouch": true
    },

    // type=place 放置方块
    // 注意这里判断的是放下的方块的数据
    // 使用时谨防玩家反复拆放刷经验
    {
      "type": "place",
      "exp": [5, 10],

      // 放置这些方块可以获得经验
      "value": [
        // 种植土豆
        "minecraft:potatoes"
      ]
    },
    {
      // 同上
      "type": "place",
      "exp": 1,

      // 这里也可以使用一个 [string, number] 的数组指定方块的数据值
      "value": [
        // 数据值为 2 的木头代表白桦木
        ["minecraft:wood", 2]
      ]
    },

    // kill 杀死生物
    {
      "type": "kill",
      "exp": [25, 50],

      // 杀死这些生物可以获得经验
      // 注意 这里不支持特殊值
      "value": [
        "minecraft:zombie",
        "minecraft:skeleton",
        "minecraft:creeper",
        "minecraft:spider"
      ]
    }
  ],

  // 奖励配置数组
  "award": [
    // 奖励条件介绍
    // 每个奖励项只能设置一种条件
    {
      // 奖励的等级区间，这项代表 1~16 级
      "levelRange": [1, 16],

      // 奖励的物品类型
      "type": "minecraft:iron_ingot",

      // 奖励的物品数量，可以是一个固定值或一个区间
      "amount": 5
    },
    {
      // 指定等级，这里代表 5 级、10 级，和 15 级
      "levels": [5, 10, 15],
      "type": "minecraft:netherite_ingot",

      // 可以设定区间内随机奖励数量
      "amount": [1, 2]
    },
    {
      // 使用 js 表达式判断奖励条件
      // 可以使用 js 内置函数、类等，建议高阶用户使用
      // 这里表示等级是偶数时才有奖励
      "checkLvlFormula": "lvl % 2 === 0",
      "type": "minecraft:emerald",
      "amount": 16
    },
    {
      // 没有等级条件的奖励，每次升级都会给
      "type": "minecraft:diamond",
      "amount": [1, 3]
    }

    // 奖励类型请看 https://github.com/lgc-LLSEDev/DailyFortune#pluginsdailyfortunefortunejson
    // 奖励发放代码我是从这个插件里薅过来的（ 懒得再写一遍文档
    // 注：本插件不能 dump 物品信息，请使用上面链接中的插件来 dump，或者使用其他方法
  ]
}
```

以上是配置文件的内容和说明，你可以根据自己的需求修改它们，但是请不要改变它们的格式和类型，否则可能会导致插件无法正常工作。

## 使用方法

使用这个插件，你只需要正常地玩游戏，就可以获得经验值，并且根据经验值提升等级，每次升级都会获得一些奖励。当你获得经验时，你可以在游戏中看到你的经验和等级信息。

### PAPI 变量

你可以在其他插件中使用 PAPI 变量来显示它们。这些变量有：

- `%pexp_lvl%`：玩家的等级
- `%pexp_exp%`：玩家的经验值
- `%pexp_next_lvl_exp%`：玩家下一个等级所需的总经验值
- `%pexp_next_lvl_need_exp%`：玩家下一个等级所需的剩余经验值
- `%pexp_lvl_up_need_exp%`：玩家升级所需的剩余经验值
- `%pexp_last_login_date%`：玩家上次登录游戏日期

你可以根据自己的喜好来使用这些变量，例如在计分板上显示玩家的等级和经验。

## 联系方式

如果你有任何关于这个插件的问题、建议或者反馈，你可以通过以下的方式联系我：

- QQ：3076823485
- 吹水群：[1105946125](https://jq.qq.com/?_wv=1027&k=Z3n1MpEp)
- 邮箱：<lgc2333@126.com>

感谢你使用这个插件，希望你能喜欢它！

## 赞助

感谢大家的赞助！你们的赞助将是我继续创作的动力！

- [爱发电](https://afdian.net/@lgc2333)
- <details>
    <summary>赞助二维码（点击展开）</summary>

  ![讨饭](https://raw.githubusercontent.com/lgc2333/ShigureBotMenu/master/src/imgs/sponsor.png)

  </details>

## 更新日志

暂无
