/**
 * 爬取最后交易日的 K 线数据，用这个来获取实时数据。
 *
 * 1. 从同花顺PC数据中心打开页面 http://stockpage.10jqka.com.cn/600000。
 *   > 对应 https://d.10jqka.com.cn/v6/line/hs_600000/01/defer/today.js
 * 2. 从爱问财PC打开页面 http://www.iwencai.com/unifiedwap/result?w=600000。
 *   > 对应 http://d.10jqka.com.cn/v6/line/17_600000/11/today.js?hexin-v=...
 * 3. 从同花顺移动端打开页面 https://m.10jqka.com.cn/stockpage/hs_600000。
 *   > 对应 https://d.10jqka.com.cn/v6/line/hs_600000/01/today.js
 *
 * 这里默认使用的是第3点对应的请求地址的数据抓取。
 *
 * @module
 */
import { formatDateTime, parseJsonp } from "../../../deps.ts"
import { LatestKCrawler } from "../../crawler.ts"
import { KPeriod, LatestKData } from "../../../types.ts"
import { code2LineUrlPath, isMinutePeriod, period2LineUrlPath, thsRequestInit, ts2IsoStandard } from "./internal.ts"
import { writeTextFile } from "../_internal.ts"

export type LatestKResponsJson = {
  // 个股名称，如浦发银行 "\u6d66\u53d1\u94f6\u884c"
  name: string
  // 该请求对应的查询时间，格式为 HHmm
  dt: string
  // 数据对应的周期值，如 yyyyMMdd
  "1": string
  // 开盘价
  "7": string
  // 最高价
  "8": string
  // 最低价
  "9": string
  // 收盘价
  "11": string
  // 成交量(股)
  "13": number
  // 成交额(元)
  "19": string
  // 期货的昨日结算价
  "66": string
}

/** 同花顺股票数据器爬取实现 */
const crawl: LatestKCrawler = async (code: string, period = KPeriod.Day, debug = false): Promise<LatestKData> => {
  const type = code2LineUrlPath(code)
  const sp = period2LineUrlPath(period)
  const url = `http://d.10jqka.com.cn/v6/line/${type}_${code}/${sp}/today.js?ts=${Date.now()}`
  const response = await fetch(url, thsRequestInit)
  if (!response.ok) throw new Error(`从同花顺获取 "${code}" 数据失败：${response.status} ${response.statusText}`)

  /**
   * 响应体数据结构例子: quotebridge_v6_time_hs_600000_today({
   * })
   */
  const txt = await response.text()
  if (debug) await writeTextFile(`temp/10jqka-v6-line-today-${code}-${period}.js`, txt)

  const j = (parseJsonp(txt) as Record<string, unknown>)[`${type}_${code}`] as LatestKResponsJson
  const yyp2 = new Date().getFullYear().toString().substring(0, 2)
  const data: LatestKData = {
    // ts: formatDateTime(new Date(), "yyyy-MM-ddTHH:mm:ss"),
    // 使用服务器返回的 HHmm 值
    ts: formatDateTime(new Date(), "yyyy-MM-dd") + "T" + j.dt.substring(0, 2) + ":" + j.dt.substring(2),
    period,
    code,
    name: j.name,
    // (yy+10)MMddHHmm 转 yyyy-MM-ddTHH:ss
    t: isMinutePeriod(period)
      ? ts2IsoStandard(yyp2 + (parseInt(j["1"].substring(0, 2)) - 10) + j["1"].substring(2))
      : ts2IsoStandard(j["1"]),
    o: parseFloat(j["7"]),
    h: parseFloat(j["8"]),
    l: parseFloat(j["9"]),
    c: parseFloat(j["11"]),
    /** 成交量(股) */
    v: j["13"],
    /** 成交额(元) */
    a: parseFloat(j["19"]),
    /** 期货的昨日结算价 */
    p: j["66"] ? parseFloat(j["66"]) : undefined,
  }

  return data
}

export default crawl
