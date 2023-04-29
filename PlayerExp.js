// LiteLoaderScript Dev Helper
/// <reference path="../HelperLib/src/index.d.ts"/>
/* eslint-disable new-cap */
/* global ll mc file NBT Version */

const PLUGIN_NAME = 'PlayerExp';
const PLUGIN_DESC = '玩家经验系统';
/** @type {[number, number, number, Version]} */
const PLUGIN_VERSION = [0, 1, 0, Version.Release];
const PLUGIN_EXTRA = { Author: 'student_2333', License: 'Apache-2.0' };

const PLUGIN_DATA_PATH = `plugins/${PLUGIN_NAME}`;
const PLUGIN_CONFIG_PATH = `${PLUGIN_DATA_PATH}/config.json`;
const PLUGIN_EXP_DATA_PATH = `${PLUGIN_DATA_PATH}/exp.json`;
const DUMPED_ITEMS_FOLDER = `${PLUGIN_DATA_PATH}/dumped`;

// #region config

/**
 * @typedef {Object} BlockSourceConfig
 * @property {'mine' | 'place'} type
 * @property {number | [number, number]} exp
 * @property {(string | [string, number])[]} value
 * @property {boolean} [ignoreSilkTouch]
 */
/**
 * @typedef {Object} KillSourceConfig
 * @property {'kill'} type
 * @property {number | [number, number]} exp
 * @property {string[]} value
 */
/**
 * @typedef {Object} LoginSourceConfig
 * @property {'login'} type
 * @property {number | [number, number]} exp
 */
/**
 * @typedef {Object} ItemAwardConfig
 * @property {[number?, number?]} [levelRange]
 * @property {number[]} [levels]
 * @property {`minecraft:${string}`} type
 * @property {number | [number, number]} amount
 * @property {number} [aux]
 */
/**
 * @typedef {Object} SNbtAwardConfig
 * @property {[number?, number?]} [levelRange]
 * @property {number[]} [levels]
 * @property {string} sNbt
 * @property {number | [number, number]} [amount]
 */
/**
 * @typedef {Object} MoneyAwardConfig
 * @property {[number?, number?]} [levelRange]
 * @property {number[]} [levels]
 * @property {'money'} type
 * @property {number | [number, number]} amount
 */
/**
 * @typedef {Object} ScoreAwardConfig
 * @property {[number?, number?]} [levelRange]
 * @property {number[]} [levels]
 * @property {'score'} type
 * @property {string} scoreName
 * @property {number | [number, number]} amount
 */
/**
 * @typedef {Object} CommandAwardConfig
 * @property {[number?, number?]} [levelRange]
 * @property {number[]} [levels]
 * @property {'command'} type
 * @property {string} command
 */
/**
 * @typedef {Object} DumpFileAwardConfig
 * @property {[number?, number?]} [levelRange]
 * @property {number[]} [levels]
 * @property {'dumped'} type
 * @property {string} filename
 */
/** @typedef {ItemAwardConfig | SNbtAwardConfig | MoneyAwardConfig | ScoreAwardConfig | CommandAwardConfig | DumpFileAwardConfig} AwardConfig */
/** @typedef {BlockSourceConfig | KillSourceConfig | LoginSourceConfig} SourceConfig */
/**
 * @typedef {Object} PluginConfig
 * @property {string} calcLvlExpression
 * @property {SourceConfig[]} source
 * @property {AwardConfig[]} award
 */
/** @type {PluginConfig} */
const defaultConfig = {
  calcLvlExpression: '({{lvl}}-1)*5000',
  source: [
    {
      type: 'login',
      exp: [1000, 5000],
    },
    {
      type: 'mine',
      exp: 5,
      value: [['minecraft:wheat', 7]],
    },
    {
      type: 'mine',
      exp: 8,
      value: [['minecraft:potatoes', 3]],
    },
    {
      type: 'mine',
      exp: 50,
      value: ['minecraft:diamond_ore'],
      ignoreSilkTouch: true,
    },
    {
      type: 'place',
      exp: 5,
      value: ['minecraft:wheat'],
    },
    {
      type: 'place',
      exp: 8,
      value: ['minecraft:potatoes'],
    },
    {
      type: 'kill',
      exp: 100,
      value: ['minecraft:player'],
    },
  ],
  award: [
    {
      type: 'minecraft:diamond',
      amount: [1, 5],
    },
  ],
};

/** @type {PluginConfig} */
const config = { ...defaultConfig };

/**
 * @typedef {Object} ExperienceData
 * @property {number} exp
 * @property {number} lvl
 * @property {number} thisLevelExp
 * @property {number} nextLevelExp
 * @property {string} lastLoginDate
 */
/** @type { {[x: string]: ExperienceData} } */
const experienceData = {};

/**
 * @param {string} path
 * @returns {any}
 */
function readFile(path) {
  const txt = file.readFrom(path);
  if (!txt) throw TypeError(`配置文件 ${path} 读取失败`);
  return JSON.parse(txt);
}

if (!file.exists(PLUGIN_CONFIG_PATH)) {
  file.writeTo(PLUGIN_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
} else {
  Object.assign(config, readFile(PLUGIN_CONFIG_PATH));
}

if (!file.exists(PLUGIN_EXP_DATA_PATH)) {
  file.writeTo(PLUGIN_EXP_DATA_PATH, '{}');
} else {
  Object.assign(experienceData, readFile(PLUGIN_EXP_DATA_PATH));
}

if (!file.exists(DUMPED_ITEMS_FOLDER)) {
  file.createDir(DUMPED_ITEMS_FOLDER);
}

function writeExpData() {
  file.writeTo(PLUGIN_EXP_DATA_PATH, JSON.stringify(experienceData));
}

// #endregion

// #region util functions

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * @param {number | [number, number]} range
 * @returns number
 */
function processRandomNumber(range) {
  if (range instanceof Array) range = getRandomInt(...range);
  return range;
}

/**
 * @param {Item} item
 * @param {number} count
 * @returns {Item}
 */
function modifyItemCount(item, count) {
  const newNbt = item.getNbt();
  newNbt.setByte('Count', count);
  item.setNbt(newNbt);
  return item;
}

/**
 * @param {Player} player
 * @param {number} lvl
 */
function getAward(player, lvl) {
  /**
   * @param {AwardConfig} award
   * @returns {boolean}
   */
  const awardFilter = ({ levelRange, levels }) => {
    if (levelRange && levelRange.length) {
      const [min, max] = levelRange;
      return (min ? min <= lvl : true) && (max ? lvl <= max : true);
    }
    if (levels && levels.length) return levels.includes(lvl);
    return true;
  };

  /**
   * @param {AwardConfig} award
   * @returns {Item | null}
   */
  const getItem = (award) => {
    if ('type' in award) {
      const { type } = award;

      if (type === 'dumped') {
        const { filename } = award;

        const content = file.readFrom(`${DUMPED_ITEMS_FOLDER}/${filename}`);
        if (!content) throw TypeError(`文件 ${filename} 读取失败`);

        award = JSON.parse(content);
        return getItem(award);
      }

      if (type === 'money') {
        const { amount } = award;
        player.addMoney(processRandomNumber(amount));
        return null;
      }

      if (type === 'score') {
        const { scoreName, amount } = award;
        const scoreObj = mc.getScoreObjective(scoreName);
        if (!scoreObj)
          mc.runcmdEx(`scoreboard objectives add "${scoreName}" dummy`);

        mc.runcmdEx(
          `scoreboard players add ` +
            `"${player.realName}" "${scoreName}" ${processRandomNumber(amount)}`
        );
        return null;
      }

      if (type === 'command') {
        const { command } = award;
        mc.runcmdEx(command.replace(/\{realName\}/g, player.realName));
        return null;
      }
    }

    if ('sNbt' in award) {
      const { sNbt, amount } = award;

      const nbt = NBT.parseSNBT(sNbt);
      if (!nbt) throw TypeError(`解析 sNbt 失败`);

      let item = mc.newItem(nbt);
      if (!item) throw TypeError('创建物品对象失败');

      if (amount) item = modifyItemCount(item, processRandomNumber(amount));
      return item;
    }

    const { type, amount, aux } = award;

    const item = mc.newItem(type, processRandomNumber(amount));
    if (!item) throw TypeError('创建物品对象失败');

    if (typeof aux === 'number') item.setAux(aux);
    return item;
  };

  /** @type {Item[]} */
  // @ts-expect-error 强制类型转换
  const items = config.award
    .filter(awardFilter)
    .map(getItem)
    .filter((v) => v);
  const container = player.getInventory();

  for (const it of items) {
    if (container.hasRoomFor(it)) container.addItem(it);
    else mc.spawnItem(it, player.pos);
  }

  player.refreshItems();
}

/**
 * @param {Player} player
 * @param {ExperienceData} data
 */
function levelUp(player, { lvl }) {
  mc.runcmdEx(
    `title "${player.realName}" subtitle §6Lv.${lvl - 1} §f--> §eLv.${lvl}`
  );
  mc.runcmdEx(`title "${player.realName}" title §aLevel UP!`);
  mc.runcmdEx(
    `execute as "${player.realName}" at "${player.realName}" run playsound random.levelup @s`
  );
  getAward(player, lvl);
}

/**
 * @returns {string}
 */
function formatTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

/**
 * @param {number} lvl
 * @returns {number}
 */
function getLevelExp(lvl) {
  const exp = config.calcLvlExpression.replace(/\{\{lvl\}\}/g, lvl.toString());
  // eslint-disable-next-line no-eval
  return eval(exp);
}

/**
 * @param {string} xuid
 */
function ensurePlayerExpData(xuid) {
  if (experienceData[xuid] === undefined) {
    experienceData[xuid] = {
      exp: 0,
      lvl: 1,
      thisLevelExp: 0,
      nextLevelExp: getLevelExp(2),
      lastLoginDate: '',
    };
    writeExpData();
  }
}

/**
 * @param {string | Player} player
 * @param {number} exp
 */
function setPlayerExp(player, exp) {
  const isXuid = typeof player === 'string';
  const xuid = isXuid ? player : player.xuid;
  ensurePlayerExpData(xuid);

  const expData = experienceData[xuid];
  expData.exp = exp;

  while (expData.exp >= expData.nextLevelExp) {
    expData.lvl += 1;
    expData.thisLevelExp = expData.nextLevelExp;
    expData.nextLevelExp = getLevelExp(expData.lvl + 1);

    if (!isXuid) levelUp(player, expData);
  }

  writeExpData();
  return exp;
}

/**
 * @param {string | Player} player
 * @returns {ExperienceData}
 */
function getPlayerExpData(player) {
  if (!(typeof player === 'string')) player = player.xuid;
  ensurePlayerExpData(player);
  return experienceData[player];
}

/**
 * @param {string | Player} player
 * @param {number | [number, number]} exp
 * @returns {number}
 */
function addPlayerExp(player, exp) {
  exp = processRandomNumber(exp);
  setPlayerExp(player, getPlayerExpData(player).exp + exp);
  return exp;
}

/**
 * @param {Item} item
 * @returns {boolean}
 */
function checkHasSilkTouch(item) {
  if (!item.isEnchanted || item.isEnchantingBook) return false;

  /** @type { { tag: { ench: ({ id: number, lvl: number })[] } } } */
  const nbt = item.getNbt().toObject();

  for (const ench of nbt.tag.ench) if (ench.id === 16) return true;

  return false;
}

/**
 * @param {Player} player
 * @param {number} total
 */
function sendAddXpTip(player, total) {
  // generate a text progress bar
  const { exp, thisLevelExp, nextLevelExp, lvl } = getPlayerExpData(
    player.xuid
  );
  const progress = (exp - thisLevelExp) / (nextLevelExp - thisLevelExp);

  const barMax = 25;
  const barProgress = Math.ceil(barMax * progress);
  const bar = ['§a'];
  for (let i = 0; i < barMax; i += 1) {
    if (i === barProgress) bar.push('§7');
    bar.push('|');
  }
  const barTxt = bar.join('');

  if (total) {
    player.sendText(
      `§bLv.${lvl} §r| ${barTxt} §a(+${total} XP) §r| §e${exp} §7/ §g${nextLevelExp}`,
      5
    );
    mc.runcmdEx(
      `execute as "${player.realName}" at "${player.realName}" run playsound random.orb @s ~ ~ ~ 0.3`
    );
  }
}

// #endregion

// #region listeners

/**
 * @param {Block} block
 * @param {BlockSourceConfig} source
 * @returns {boolean}
 */
function checkBlockType(block, source) {
  for (const value of source.value) {
    const [type, tileData] = value instanceof Array ? value : [value, null];
    if (type === block.type && (tileData ? tileData === block.tileData : true))
      return true;
  }

  return false;
}

/** @type {BlockSourceConfig[]} */
// @ts-expect-error 强制类型转换
const destroySources = config.source.filter((s) => s.type === 'mine');
mc.listen('onDestroyBlock', (player, block) => {
  if (player.isCreative) return;

  let total = 0;

  for (const source of destroySources) {
    if (
      (source.ignoreSilkTouch ? !checkHasSilkTouch(player.getHand()) : true) &&
      checkBlockType(block, source)
    )
      total += addPlayerExp(player, source.exp);
  }

  sendAddXpTip(player, total);
});

/** @type {BlockSourceConfig[]} */
// @ts-expect-error 强制类型转换
const placeSources = config.source.filter((s) => s.type === 'place');
mc.listen('afterPlaceBlock', (player, block) => {
  if (player.isCreative) return;

  let total = 0;

  for (const source of placeSources) {
    if (source.value.includes(block.type) && checkBlockType(block, source))
      total += addPlayerExp(player, source.exp);
  }

  sendAddXpTip(player, total);
});

/** @type {KillSourceConfig[]} */
// @ts-expect-error 强制类型转换
const killSources = config.source.filter((s) => s.type === 'kill');
mc.listen('onMobDie', (mob, source) => {
  if (!source || !source.isPlayer()) return;

  const player = source.toPlayer();
  if (!player || player.isCreative) return;

  let total = 0;

  for (const expSource of killSources) {
    if (expSource.value.includes(mob.type))
      total += addPlayerExp(player, expSource.exp);
  }

  sendAddXpTip(player, total);
});

/** @type {LoginSourceConfig[]} */
// @ts-expect-error 强制类型转换
const loginSources = config.source.filter((s) => s.type === 'login');
mc.listen('onJoin', (player) => {
  if (player.isCreative) return;

  const { xuid } = player;
  const today = formatTodayDate();
  const playerData = getPlayerExpData(xuid);
  ensurePlayerExpData(xuid);

  let total = 0;

  if (playerData.lastLoginDate !== today) {
    for (const source of loginSources) {
      total += addPlayerExp(player, source.exp);
    }

    playerData.lastLoginDate = today;
    writeExpData();
  }

  sendAddXpTip(player, total);
});

// #endregion listeners

ll.registerPlugin(PLUGIN_NAME, PLUGIN_DESC, PLUGIN_VERSION, PLUGIN_EXTRA);
