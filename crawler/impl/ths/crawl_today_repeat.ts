import { formatDateTime, gray, green, parseArgs, pathExistsSync, red, TerminalProgress } from "../../../deps.ts"
import { KPeriod, LatestKData } from "../../../types.ts"
import { default as crawlTodayLatestK } from "./crawl_today.ts"
import { default as crawlLast360K } from "./crawl_last360.ts"
import { writeTextFile } from "../_internal.ts"

// 创建临时文件夹
if (!pathExistsSync("temp")) Deno.mkdir("temp")

// log arguments help
console.log(gray(`参数帮助：
  -c 指定代码，默认 600000
  -p 指定周期(day、week、month、year、minute1、minute5、minute30、minute60)，默认 day
  -s 指定间隔秒数，默认 1 秒
  -m 是否每次新数据输出到新行
  如 "deno run -A ./crawler/impl/ths/crawl_today_repeat.ts -c FG9999 -p minute1 -s 5 -m"`))

// parse cli arguments
const args = parseArgs(Deno.args, { string: ["c", "p"] })
const code: string = Object.hasOwn(args, "c") ? args["c"] as string : "600000"
const period = Object.hasOwn(args, "p") ? args["p"] as KPeriod : KPeriod.Day
const seconds = Object.hasOwn(args, "s") ? args["s"] as number : 1
const multiline = Object.hasOwn(args, "m")

// 显示昨天数据
const ks = await crawlLast360K(code, KPeriod.Day)
console.info(ks.code + " " + ks.name)
const preDayK = ks.data[ks.data.length - 2]
const preDayK1 = ks.data[ks.data.length - 3]
let zf = ((preDayK.c - preDayK1.c) / preDayK1.c * 100).toFixed(2) + "%"
let k = `PreDayK=${JSON.stringify(Object.assign(preDayK, { zf: zf }))}`
console.log(zf.startsWith("-") ? green(k) : red(k))

// 显示当天开盘数据及期货昨日结算价
const latestDayK = ks.data[ks.data.length - 1]
zf = ((latestDayK.o - preDayK.c) / preDayK.c * 100).toFixed(2) + "%"
k = `LatestDayK=${JSON.stringify({ t: latestDayK.t, o: latestDayK.o, p: latestDayK.p, ozf: zf })}`
console.log(zf.startsWith("-") ? green(k) : red(k))

// 初始化进度条
const progress = new TerminalProgress({
  start: 0,
  end: 24 * 60 * 60,
  template: "${c.blue(ts())} ${c.gray(period)} ${up ? c.red(k) : c.green(k)}",
  extra: {
    ts: () => formatDateTime(new Date(), "HH:mm:ss"),
    k: "",
    up: true,
    period: "",
  },
})

async function crawl2File(code: string, period: KPeriod, debug = false): Promise<LatestKData> {
  const ts = formatDateTime(new Date(), "HH:mm:ss")
  const data = await crawlTodayLatestK(code, period, { debug })
  const j = JSON.stringify(data)
  // console.log(`${ts} ${j}`)
  if (debug) await writeTextFile(`temp/today-${code}-${period}.json`, `${ts} ${j}\r\n`, { append: true })
  return data
}

async function repeat(code: string, seconds: number, period: KPeriod): Promise<void> {
  progress.options.extra.period = period
  return await new Promise((_resolve) => {
    setInterval(async () => {
      try {
        const k = await crawl2File(code, period, false)
        const zf = ((k.c - preDayK.c) / preDayK.c * 100).toFixed(2) + "%"
        progress.options.extra.up = !zf.startsWith("-")
        progress.options.extra.k = JSON.stringify({
          t: k.t,
          o: k.o,
          h: k.h,
          l: k.l,
          c: k.c,
          v: k.v,
          a: k.a,
          zf: zf,
        })
        if (multiline) progress.end()
        progress.to()
      } catch (error) {
        progress.end()
        console.error(red(error.message))
      }
    }, seconds * 1000)
  })
}

// 循环爬取当期指定周期数据
await repeat(code, seconds, period)
