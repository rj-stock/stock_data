// 仅在本目录内使用的内部函数
import { userAgent } from "../../../browser.ts"
import { formatDateTime } from "../../../deps.ts"
import { KData, KPeriod, StockKData } from "../../../types.ts"

export const thsRequestInit: RequestInit = {
  headers: {
    "User-Agent": userAgent,
    "Host": "d.10jqka.com.cn",
    "Referer": "http://www.iwencai.com/",
  },
}

/** 转换代码为获取K线数据url的一个子路径。应仅在 tsh 目录内使用。 */
export function code2LineUrlPath(code: string): string {
  // 以数字开头的是股票或板块(88开头)，其余视作期货
  return isNaN(Number(code.charAt(0))) ? "qh" : (code.startsWith("88") ? "bk" : "hs")
}

/** 转换周期类型为获取K线数据url的一个子路径。应仅在 tsh 目录内使用。 */
export const period2LineUrlPath = (period: KPeriod): string => {
  switch (period) {
    case KPeriod.Day:
      return "00"
    case KPeriod.Week:
      return "10"
    case KPeriod.Month:
      return "20"
    case KPeriod.Year:
      return "80"
    case KPeriod.Quarter:
      return "90"

    case KPeriod.Minute1:
      return "60"
    case KPeriod.Minute5:
      return "30"
    case KPeriod.Minute30:
      return "40"
    case KPeriod.Minute60:
      return "50"
    default:
      throw new Error(`Not yet supported period "${period}"`)
  }
}

/**
 * 转换整数格式日期值为标准 ISO 格式。
 *
 * 1. yyyyMMddHHmmss > yyyy-MM-ddTHH:mm:ss
 * 2. yyyyMMddHHmm > yyyy-MM-ddTHH:mm
 * 2. yyyyMMddHH > yyyy-MM-ddTHH
 * 3. yyyyMMdd > yyyy-MM-dd
 * 4. yyyyMM > yyyy-MM
 * @param ts 整数日期值，如 202312011300
 * @returns ISO 格式的日期值
 */
export function ts2IsoStandard(ts: string | number): string {
  const t = `${ts}`
  const len = t.length
  if (len >= 14) { // yyyyMMddHHmmss
    return `${t.substring(0, 4)}-${t.substring(4, 6)}-${t.substring(6, 8)}T${t.substring(8, 10)}:${
      t.substring(10, 12)
    }:${t.substring(12)}`
  } else if (len === 12) { // yyyyMMddHHmm
    return `${t.substring(0, 4)}-${t.substring(4, 6)}-${t.substring(6, 8)}T${t.substring(8, 10)}:${t.substring(10)}`
  } else if (len === 10) { // yyyyMMddHH
    return `${t.substring(0, 4)}-${t.substring(4, 6)}-${t.substring(6, 8)}T${t.substring(8)}`
  } else if (len === 8) { // yyyyMMdd
    return `${t.substring(0, 4)}-${t.substring(4, 6)}-${t.substring(6)}`
  } else if (len === 6) { // yyyyMM
    return `${t.substring(0, 4)}-${t.substring(4)}`
  } else return t
}

/**
 * `http://d.10jqka.com.cn/v6/line/${nn}_${code}/${sp}/last${x}.js`
 * 的响应体的 json 数据结构
 * 响应体为 quotebridge_v6_line_${nn}_${code}_01_lastX(LastXResponsJson)
 */
export type LastXResponsJson = {
  // 个股名称，如浦发银行 "\u6d66\u53d1\u94f6\u884c"
  name: string
  // 此周期首个数据的起始日期或时间：年月季周日周期的格式为 yyyyMMdd、分钟周期的格式为 yyyyMMddHHmm
  start: string
  // 此周期的总有K线个数
  total: string
  // 当前返回的实际K线个数
  num: number
  // 每个K线的数据用分号连接的字符串，格式为 "yyyyMMdd,开盘价,最高价,最低价,收盘价,成交量(股数),成交额(元),...;..."。
  // 如 60000 的 "...;20230414,7.28,7.31,7.25,7.27,25074604,182629850.00,0.085,,,0"
  data: string
}

/** 解析 lastX.js 请求所响应的的 json 数据为 StockData 数据结构。 */
export function parseLastXJson2StockData(code: string, j: LastXResponsJson, period: KPeriod): StockKData {
  const kk = j.data.split(";")
  const stockData: StockKData = {
    ts: formatDateTime(new Date(), "yyyy-MM-ddTHH:mm:ss"),
    period,
    code,
    name: j.name,
    start: ts2IsoStandard(j.start),
    total: parseInt(j.total),
    dataCount: kk.length,
    data: kk.map((k) => {
      const ks = k.split(",")
      const kd: KData = {
        t: ts2IsoStandard(ks[0]),
        o: parseFloat(ks[1]),
        h: parseFloat(ks[2]),
        l: parseFloat(ks[3]),
        c: parseFloat(ks[4]),
        /** 成交量(股) */
        v: parseInt(ks[5]),
        /** 成交额(元) */
        a: parseFloat(ks[6]),
        /** 期货的昨日结算价 */
        p: ks[8] ? parseFloat(ks[8]) : undefined,
      }
      return kd
    }),
  }

  return stockData
}

export function isMinutePeriod(period: KPeriod): boolean {
  return period.toString().startsWith("minute")
}
