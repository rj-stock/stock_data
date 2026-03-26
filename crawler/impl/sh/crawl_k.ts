/**
 * 从上交所爬取标的 K 线数据。
 *
 * 方式1：
 * 1. 打开上交所主页 http://www.sse.com.cn，输入搜索的标的代码 60000，
 * 2. 回车就会弹出个股页面信息页 http://www.sse.com.cn/home/search/index.shtml?webswd=600000
 * 3. 在这个页面的全部页签(默认)会显示分时图
 * 4. 点击数据页签可以看到上市公司的基本信息(上市日期、名称 、地址、股东、股权)
 * 5. 发出查询个股信息的请求 http://query.sse.com.cn/search/getDataSearch.do?jsonCallBack=jsonpCallback92673738&question=600000&searchName=dataSearchNew&_=1691378213056
 * 6. 发出查询个股当日分时信息的请求 http://yunhq.sse.com.cn:32041/v1/sh1/line/600000?callback=jQuery112408755311269277841_1691378213063&select=time%2Cprice%2Cvolume%2Cavg_price%2Camount%2Chighest%2Clowest&_=1691378213065
 *
 * 方式2：
 * 1. 点击上面方式1全部页签内分时图上方个股名称右侧的小按钮跳转到页面 http://www.sse.com.cn/assortment/stock/list/info/company/index.shtml?COMPANY_CODE=600000
 * 2. 此页面也可以看到分时图和公司信息。
 * 3. 发出查询个股信息的请求 http://query.sse.com.cn/commonQuery.do?jsonCallBack=jsonpCallback15104694&isPagination=false&sqlId=COMMON_SSE_CP_GPJCTPZ_GPLB_GPGK_GSGK_C&COMPANY_CODE=600000&_=1691378809412
 * 4. 发出查询个股当日分时信息的请求 http://yunhq.sse.com.cn:32041/v1/sh1/line/600000?callback=jQuery112408755311269277841_1691378213063&select=time%2Cprice%2Cvolume%2Cavg_price%2Camount%2Chighest%2Clowest&_=1691378213065
 * @module
 */
import { formatDateTime } from "../../../deps.ts"
import { CrawlInit, KCrawler } from "../../crawler.ts"
import { KData, KPeriod, StockKData } from "../../../types.ts"
import { userAgent } from "../../../browser.ts"
import { period2QueryParamValue, period2UrlPath } from "./_internal.ts"
import { tsNumber2IsoStandard, writeTextFile } from "../_internal.ts"

type ResponseJson = {
  code: string // "600010"
  begin: number // 4236
  end: number // 5235
  total: number // 5235
  // [日期, 开盘价, 最高价, 最低价, 收盘价, 成交量(股), 成交额(元)]
  // [20230329, 1.89, 1.9, 1.87, 1.87, 154878819, 291735265]
  kline: [[number, number, number, number, number, number, number]]
}

/**
 * 从上交所爬取标的 K 线数据。
 */
const crawl: KCrawler = async (
  code: string,
  period = KPeriod.Day,
  init?: CrawlInit,
): Promise<StockKData> => {
  const ts = Date.now() // 1680102228108
  // 当为获取分钟周期数据时，只能获取最后交易日的数据。
  let url = `http://yunhq.sse.com.cn:32041/v1/sh1/${period2UrlPath(period)}/${code}?_=${ts}`
  url += `&period=${period2QueryParamValue(period)}`

  // 忽略 begin 和 end 参数，上交所默认是返回最近 100 根 K 线
  if (init?.start !== undefined) url += `&begin=${init?.start}`
  if (init?.end !== undefined) url += `&end=${init?.end}`
  // console.log(url)

  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      "Host": "yunhq.sse.com.cn:32041",
      "Referer": `http://www.sse.com.cn/`,
    },
  })
  if (!response.ok) throw new Error(`从上交所获取 ${code} 数据失败：${response.status} ${response.statusText}`)
  const j = await response.json() as ResponseJson
  if (init?.debug) await writeTextFile(`temp/sh-${code}-${period}-res.json`, JSON.stringify(j))
  if (j.code !== code) {
    throw new Error(`检测到上交所返回错误的数据结构：${(j as unknown as { message: string }).message}`)
  }

  // 组合数据返回
  const stockData: StockKData = {
    ts: formatDateTime(new Date(), "yyyy-MM-ddTHH:mm:ss"),
    period,
    code,
    name: "",
    // start: ts2IsoStandard(j.start),
    total: j.total,
    dataCount: j.kline.length,
    data: j.kline.map(([d, o, h, l, c, v, a]) => {
      return {
        // yyyyMMdd to "yyyy-MM-dd" or yyyyMMddHHmmss to "yyyy-MM-dd HH:mm:ss"
        t: tsNumber2IsoStandard(d),
        o,
        c,
        l,
        h,
        v,
        a,
      } as KData
    }),
  }
  return stockData
}

export default crawl
