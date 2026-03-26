/**
 * 从移动端打开页面 https://m.10jqka.com.cn/stockpage/hs_600000 收集的数据请求地址。
 */
import { parseJsonp } from "../../../deps.ts"
import { KCrawler } from "../../crawler.ts"
import { KPeriod, StockKData } from "../../../types.ts"
import {
  code2LineUrlPath,
  LastXResponsJson,
  parseLastXJson2StockData,
  period2LineUrlPath,
  thsRequestInit,
} from "./internal.ts"
import { writeTextFile } from "../_internal.ts"

/** 同花顺股票数据器爬取实现 */
const crawl: KCrawler = async (code: string, period = KPeriod.Day, debug = false): Promise<StockKData> => {
  const type = code2LineUrlPath(code)
  const sp = period2LineUrlPath(period)
  const url = `http://d.10jqka.com.cn/v6/line/${type}_${code}/${sp}/last360.js?ts=${Date.now()}`
  const response = await fetch(url, thsRequestInit)
  if (!response.ok) throw new Error(`从同花顺获取 "${code}" 数据失败：${response.status} ${response.statusText}`)

  /**
   * 响应体数据结构例子: quotebridge_v6_line_hs_000158_00_last360({
   *   "data":"yyyyMMdd,open,high,low,close,vol,amo,...;...",
   *   "name":"\u5e38\u5c71\u5317\u660e","start":"20000724","total":"5361",
   *   "marketType":"HS_stock_sz","issuePrice":"","today":"20230412",
   *   "rt":"0930-1130,1300-1500","num":360,
   *   "year":{"2000":110,...,"2023":65},
   * })
   */
  const txt = await response.text()
  if (debug) await writeTextFile(`temp/10jqka-v6-line-last360-${code}-${period}.js`, txt)

  const j = parseJsonp(txt) as LastXResponsJson
  return parseLastXJson2StockData(code, j, period)
}

export default crawl
