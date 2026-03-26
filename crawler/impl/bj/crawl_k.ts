/**
 * 从北交所爬取标的 K 线数据。
 *
 * 1. 打开北交所主页/产品/股票列表>点击个股的行情按钮，将打开个股交易信息页面
 *    https://www.bse.cn/products/neeq_listed_companies/public_information.html?companyCode=430510
 * 2. 点击左侧的实时行情导航，将打开实时行情页面：
 *    https://www.bse.cn/products/neeq_listed_companies/company_time_sharing.html?companyCode=430017
 *    这个页面可以看到分时图、日K、周月年K
 * 3. 点击"日K线" 切换到日K图，此时会发出获取日K数据的 jsonp 请求:
 *    https://www.bse.cn/companyEchartsController/getKLine/list/430017.do?%7B%22begin%22%3A0%2C%22end%22%3A-1%2C%22type%22%3A%22dayKline%22%2C%22xxfcbj%22%3A2%7D&callback=jQuery331_1691408551374&begin=0&end=-1&type=dayKline&xxfcbj=2&_=1691408551383
 *    此 url 可以简化为 https://www.bse.cn/companyEchartsController/getKLine/list/430510.do?type=dayKline&xxfcbj=2
 *    直接返回个股在北交所上市以来的所有 K 线数据(不复权)，json 格式为
 *    ```json
 *    {
 *      status: 0,
 *      msg: "",
 *      data: [
 *        {
 *          "cjje":411918.350, // 成交额（元）
 *          "cjl":47516,       // 成交量（股）
 *          "jrsp":8.620,      // 收盘价
 *          "jrkp":8.900,      // 开盘价
 *          "jsrq":"20230807", // 日期
 *          "drzd":8.900,      // 最高价
 *          "drzx":8.600,      // 最低价
 *          "zrsp":8.650       // 昨日收盘价
 *        },...
 *      ]
 *    }
 *    ```
 * @module
 */
import { formatDateTime } from "../../../deps.ts"
import { CrawlInit, KCrawler } from "../../crawler.ts"
import { KData, KPeriod, StockKData } from "../../../types.ts"
import { userAgent } from "../../../browser.ts"
import { period2QueryParamValue } from "./_internal.ts"
import { writeTextFile } from "../_internal.ts"

type ResponseJson = {
  status: number
  msg: string
  data: [DataItem]
}
type DataItem = {
  // 日期
  jsrq: string
  // 成交额（元）
  cjje: number
  // 成交量（股）
  cjl: number
  // 收盘价
  jrsp: number
  // 开盘价
  jrkp: number
  // 最高价
  drzd: number
  // 最低价
  drzx: number
  // 昨日收盘价
  zrsp: number
}

/**
 * 从北交所爬取标的 K 线数据。
 */
const crawl: KCrawler = async (
  code: string,
  period = KPeriod.Day,
  init?: CrawlInit,
): Promise<StockKData> => {
  const ts = Date.now() // 1680102228108
  let url = `https://www.bse.cn/companyEchartsController/getKLine/list/${code}.do?xxfcbj=2&ts=${ts}`
  url += `&type=${period2QueryParamValue(period)}`

  // 实测 begin 和 end 参数没有任何效果
  if (init?.start !== undefined) url += `&begin=${init?.start}`
  if (init?.end !== undefined) url += `&end=${init?.end}`
  // console.log(url)

  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      "Host": "www.bse.cn",
      "Referer": `https://www.bse.cn/products/neeq_listed_companies/company_time_sharing.html?companyCode=${code}`,
    },
  })
  if (!response.ok) throw new Error(`从北交所获取 ${code} 数据失败：${response.status} ${response.statusText}`)
  const j = await response.json() as ResponseJson
  if (init?.debug) await writeTextFile(`temp/bj-${code}-${period}-res.json`, JSON.stringify(j))
  if (j.status !== 0) {
    throw new Error(`检测到北交所返回错误的数据结构：${(j as unknown as { msg: string }).msg}`)
  }

  // 组合数据返回
  const stockData: StockKData = {
    ts: formatDateTime(new Date(), "yyyy-MM-ddTHH:mm:ss"),
    period,
    code,
    name: "",
    total: j.data.length,
    dataCount: j.data.length,
    data: j.data.map(({ jsrq, cjje, cjl, jrsp, jrkp, drzd, drzx }) => {
      return {
        t: jsrq,
        o: jrkp,
        c: jrsp,
        l: drzx,
        h: drzd,
        v: cjl,
        a: cjje,
      } as KData
    }),
  }
  return stockData
}

export default crawl
