/**
 * 获取上交所全部股票列表。
 *
 * 来源：
 * 1. 打开上海证券交易所主页，然后点击“产品/股票列表” http://www.sse.com.cn/assortment/stock/list/share/
 * 2. 这个页面会发出一个 js 请求 http://www.sse.com.cn/js/common/ssesuggestdata.js?v=20238621，
 *    这个 js 的内容仅包含一个无参函数 get_data() 的定义，其返回值就是所有的股票列表数组（主板60+科创板68+B股90）。
 *    数组结构为 [{val:"600000",val2:"浦发银行",val3:"pfyx"}, ...]。
 *    另外这个 js 的第一行的注释信息显示了数据的截止日期，如 “//staticDate=2023-08-04 18:00:01”
 * 3. 还有一个 jsonp 分页请求
 *    http://query.sse.com.cn/sseQuery/commonQuery.do?jsonCallBack=jsonpCallback79087106
 *      &STOCK_TYPE=1&REG_PROVINCE=&CSRC_CODE=&STOCK_CODE=&sqlId=COMMON_SSE_CP_GPJCTPZ_GPLB_GP_L
 *      &COMPANY_STATUS=2%2C4%2C5%2C7%2C8&type=inParams&isPagination=true
 *      &pageHelp.cacheSize=1&pageHelp.beginPage=1&pageHelp.pageSize=25&pageHelp.pageNo=1&pageHelp.endPage=1
 *      &_=1691328007040
 *    这个请求会返回包含上市日期的信息，格式为：
 *    jsonpCallback79087106({result:[{A_STOCK_CODE: "600000", COMPANY_ABBR: "浦发银行", LIST_DATE: "19991110", ...}, ...], ...}
 * 注：这个 API 接口返回的标的代码包含了 B 股的信息，这里的实现会自动去掉 B 股，仅保留主板和科创板。
 * @module
 */
import { ListCrawler } from "../../crawler.ts"
import { StockBase } from "../../../types.ts"
import { writeTextFile } from "../_internal.ts"

type Item = {
  // 标的代码
  val: string
  // 标的名称
  val2: string
}

/**
 * 获取全部股票列表
 * @param debug 是否将响应的 body 保存到 temp/sh-list-res.js 文件
 * @param getStartDate 是否获取标的的上市日期
 * @returns
 */
const crawl: ListCrawler = async (debug = false): Promise<StockBase[]> => {
  const url = `http://www.sse.com.cn/js/common/ssesuggestdata.js?v=${Date.now()}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`从上交所获取全部股票清单失败：${response.status} ${response.statusText}`)

  const t = await response.text()
  if (debug) await writeTextFile("temp/sh-list-res.js", t)
  if (!t.includes("function get_data(){")) throw new Error("从上交所获取全部股票清单失败：返回结果无 get_data 函数")

  // 解析数据
  const items: Item[] = (new Function(t + ";return get_data();"))()
  return items
    .map(({ val, val2 }: Item) => ({ code: val, name: val2 } as StockBase))
    // 仅保留沪主板和科创板
    .filter(({ code }: StockBase) => code.startsWith("60") || code.startsWith("68"))
}

export default crawl
