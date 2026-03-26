/**
 * 可以从如下几个页面获取最后交易日的分时信息：
 *
 * 1. 从同花顺PC数据中心打开页面 http://stockpage.10jqka.com.cn/600000。
 *   > 对应 https://d.10jqka.com.cn/v6/time/hs_600000/defer/last.js
 * 2. 从爱问财PC打开页面 http://www.iwencai.com/unifiedwap/result?w=600000。
 *   > 对应 http://d.10jqka.com.cn/v6/time/17_600000/last.js?hexin-v=...
 * 3. 从同花顺移动端打开页面 https://m.10jqka.com.cn/stockpage/hs_600000。
 *   > 对应 https://d.10jqka.com.cn/v6/time/hs_600000/last.js
 *
 * 这里默认使用的是第3点对应的请求地址的数据抓取。
 *
 * @module
 */
import { formatDateTime, parseJsonp } from "../../../deps.ts"
import { TimeCrawler } from "../../crawler.ts"
import { KPeriod, StockTimeData } from "../../../types.ts"
import { code2LineUrlPath, thsRequestInit, ts2IsoStandard } from "./internal.ts"
import { writeTextFile } from "../_internal.ts"

export type TimeResponsJson = {
  // 标的名称，如浦发银行 "\u6d66\u53d1\u94f6\u884c"
  name: string
  // 股票昨日收盘价、期货昨日结算价
  pre: number
  // 分时数据的数据数量，即分钟数，与交易时间的分钟数对应
  dotsCount: number
  // 分时数据对应的日期
  date: string
  // 每个分时数据用分号连接的字符串，格式为 "时间HHmm,现价,成交额(元),均价,成交量(股);..."。
  // 如 60000 的 "...;20230414,7.28,7.31,7.25,7.27,25074604,182629850.00,0.085,,,0"
  data: string
}

/** 同花顺股票数据器爬取实现 */
const crawl: TimeCrawler = async (code: string, debug = false): Promise<StockTimeData> => {
  const type = code2LineUrlPath(code)
  const url = `https://d.10jqka.com.cn/v6/time/${type}_${code}/last.js?ts=${Date.now()}`
  const response = await fetch(url, thsRequestInit)
  if (!response.ok) throw new Error(`从同花顺获取 "${code}" 数据失败：${response.status} ${response.statusText}`)

  /**
   * 响应体数据结构例子: quotebridge_v6_time_hs_600000_last({
   *   "hs_600000": {
   *     "name": "\u6d66\u53d1\u94f6\u884c",
   *     "open": 0,
   *     "stop": 0,
   *     "isTrading": 0,
   *     "rt": "0930-1130,1300-1500",
   *     "tradeTime": ["0930-1130", "1300-1500"],
   *     "pre": "7.25",
   *     "date": "20230414",
   *     "data": "0930,7.28,2021656,7.280,277700;...;1500,7.27,5452400,7.284,749986",
   *     "dotsCount": 242,
   *     "dates": ["20230414"],
   *     "afterTradeTime": "",
   *     "marketType": "HS_stock_sh",
   *   },
   * })
   */
  const txt = await response.text()
  if (debug) await writeTextFile(`temp/10jqka-v6-time-last-${code}.js`, txt)

  const j = (parseJsonp(txt) as Record<string, unknown>)[`${type}_${code}`] as TimeResponsJson
  const kk = j.data.split(";")
  const stockData: StockTimeData = {
    ts: formatDateTime(new Date(), "yyyy-MM-ddTHH:mm:ss"),
    period: KPeriod.Time,
    code,
    name: j.name,
    pre: j.pre,
    date: ts2IsoStandard(j.date),
    dataCount: j.dotsCount,
    data: kk.map((k) => {
      const ks = k.split(",")
      const kd = {
        t: ks[0].substring(0, 2) + ":" + ks[0].substring(2),
        /** 现价 */
        c: parseFloat(ks[1]),
        /** 成交额(元) */
        a: parseFloat(ks[2]),
        /** 均价 */
        j: parseFloat(ks[3]),
        /** 成交量(股) */
        v: parseFloat(ks[4]),
      }
      return kd
    }),
  }

  return stockData
}

export default crawl
