import { crawlK as crawlShK, crawlList as crawlShList } from "./impl/sh/mod.ts"
import { crawlK as crawlSzK, crawlList as crawlSzList } from "./impl/sz/mod.ts"
import { crawlK as crawlBjK, crawlList as crawlBjList } from "./impl/bj/mod.ts"
import { KPeriod, StockBase, StockKData } from "../types.ts"
import { KCrawler, toError } from "./crawler.ts"
import { CrawlInit } from "./crawler.ts"

/**
 * 爬取全市场所有股票列表(仅包含标的代码和名称)。
 * 包含沪市主板科创板、深市主板创业板、北市4和8开头。
 *
 * 先尝试从交易所获取，若有失败再尝试从小熊同学 api 获取。
 * 返回值键为标的代码、值为标的简称。
 */
export async function crawlAllStock(): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  let failedSh = false
  let failedSz = false
  let failedBj = false

  // 上交所
  let sub: StockBase[] = []
  try {
    sub = await crawlShList()
  } catch (e) {
    console.error("上交所: " + toError(e).message)
    failedSh = true
  }
  if (sub.length) for (const { code, name } of sub) map[code] = name

  // 北交所
  sub = []
  try {
    sub = await crawlBjList()
  } catch (e) {
    console.error("北交所: " + toError(e).message)
    failedBj = true
  }
  if (sub.length) for (const { code, name } of sub) map[code] = name

  // 深交所
  sub = []
  try {
    sub = await crawlSzList()
  } catch (e) {
    console.error("深交所: " + toError(e).message)
    failedSz = true
  }
  if (sub.length) for (const { code, name } of sub) map[code] = name

  // 候选小熊
  sub = []
  if (failedSh || failedSz || failedBj) {
    try {
      sub = await crawlSzList()
    } catch (e) {
      console.error("小熊: " + toError(e).message)
    }
  }
  if (sub.length) for (const { code, name } of sub) map[code] = name

  return map
}

/** 封装从交易所获取 K 线的方法 */
const crawlKFromJys: KCrawler = (
  code: string,
  period = KPeriod.Day,
  init?: CrawlInit,
): Promise<StockKData> => {
  if (code.startsWith("0") || code.startsWith("3")) {
    return crawlSzK(code, period, init)
  } else if (code.startsWith("6")) {
    return crawlShK(code, period, init)
  } else if (code.startsWith("4") || code.startsWith("8")) {
    return crawlBjK(code, period, init)
  } else throw new Error(`Unsupport jys code ${code}`)
}
export { crawlKFromJys }
