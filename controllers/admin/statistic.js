const moment = require("moment");

const Product = require("../../models/product");
const Order = require("../../models/order");
const { BadRequest, ServerError, Get } = require("../../ulti/response");

exports.statistic = async (req, res) => {
  try {
    // const start = moment('2021-12-12').toDate();
    // const end = moment('2021-12-14').toDate();
    // console.log(start,end)

    const [total7day, totalPerMonth, top5] = await Promise.all([
      totalOrderPrice7DayLatest(),
      totalOrderPricePerMonthByYear(2021),
      top5HotProduct(),
    ]);

    return Get(res, { result: { total7day, totalPerMonth, top5 } });
    //http://localhost:8000/api/statistic/
  } catch (error) {
    return ServerError(res, error.message);
  }
};

function totalOrderPriceInDateRange(start, end) {
  return Order.aggregate([
    {
      $unwind: "$process",
    },
    {
      $match: {
        "process.type": "delivered",
        "process.date": {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$totalAmount",
        },
        totalTransactions: {
          $sum: 1,
        },
      },
    },
  ]).exec();
}

async function totalOrderPrice7DayLatest() {
  const data = { cac_ngay: [], doanh_thu: [] };
  const result = [];
  for (let subtractDays = 1; subtractDays <= 7; subtractDays++) {
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - subtractDays);
    const temp = startDate;
    data.cac_ngay.push(moment(startDate).format("DD-MM-YYYY"));
    startDate.setUTCHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setDate(endDate.getDate() - subtractDays);
    endDate.setUTCHours(23, 59, 59, 999);

    const totalPrice = totalOrderPriceInDateRange(startDate, endDate);
    result.push(totalPrice);
  }
  const final = await Promise.all(result);

  //sẽ có ngày ế không bán được thì thống kê trả về mảng rỗng nên phải set 0 cho những ngày đó
  data.doanh_thu = final.map((data) => (data.length > 0 ? data[0].total : 0));
  return data;
}

async function totalOrderPricePerMonthByYear(year) {
  const result = [];
  for (let countMonth = 0; countMonth < 12; countMonth++) {
    let startMonth = new Date(year, countMonth);
    //lấy ngày đầu tiên của tháng tiếp theo
    startMonth.setDate(startMonth.getDate() + 1);
    startMonth.setUTCHours(0, 0, 0, 0);

    let endMonth = new Date(year, countMonth + 1);
    // endMonth.setDate(endMonth.getDate() - countMonth);
    endMonth.setUTCHours(23, 59, 59, 999);
    //console.log(startMonth, endMonth)

    const totalPrice = totalOrderPriceInDateRange(startMonth, endMonth);
    result.push(totalPrice);
  }
  const final = await Promise.all(result);

  //sẽ có tháng ế không bán được thì thống kê trả về mảng rỗng nên phải set 0 cho những tháng đó
  const doanh_thu = final.map((data) => (data.length > 0 ? data[0].total : 0));
  return { year, doanh_thu };
}

async function top5HotProduct() {
  const products = await Product.find({})
    .sort({ quantitySold: -1 })
    .limit(5)
    .exec();

  const result = { cac_san_pham: [], so_luong_da_ban: [] };

  products.forEach((product) => {
    result.cac_san_pham.push(product.name);
    result.so_luong_da_ban.push(product.quantitySold);
  });

  return result;
}
