const moment = require("moment");
const Category = require("../../models/category");
const Product = require("../../models/product");
const Order = require("../../models/order");
const Address = require("../../models/address");
const { Response, ServerError, Get } = require("../../ulti/response");

const populateCategory = (categories, parentId = null) => {
  const result = [];
  let childCategories;
  if (!parentId) {
    childCategories = categories.filter(
      (category) => category.parentId === undefined
    );
  } else {
    childCategories = categories.filter(
      (category) => category.parentId === parentId.toString()
    );
  }
  for (let category of childCategories) {
    result.push({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      type: category.type,
      children: populateCategory(categories, category._id),
    });
  }
  return result;
};
exports.initialData = async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const [categories, products, orders, total7day, totalPerMonth, top5] =
      await Promise.all([
        Category.find(),
        Product.find(),
        Order.find({})
          .sort({ createdAt: -1 })
          .populate("items.productId", "name productPictures")
          .lean(),
        totalOrderPrice7DayLatest(),
        totalOrderPricePerMonthByYear(year),
        top5HotProduct(),
      ]);
    const orderWithAddress = await populateAddress(orders);
    const revenue = orders.reduce((acc, o) => {
      if (
        o.process.findIndex((p) => p.type === "delivered" && p.isCompleted) > 0
      ) {
        acc += o.totalAmount;
      }
      return acc;
    }, 0);

    // return res.sendFile(__dirname + '/admin.html');
    return Get(res, {
      result: {
        categories,
        products,
        orders: orderWithAddress,
        statistic: {
          revenue,
          totalProduct: products.length,
          totalOrder: orders.length,
          total7day,
          totalPerMonth,
          top5,
        },
      },
    });
  } catch (error) {
    return ServerError(res, error.message);
  }
};
exports.totalOrderPricePerMonthByYear = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const totalPerMonth = await totalOrderPricePerMonthByYear(year);

    return Get(res, {
      result: {
        statistic: {
          totalPerMonth,
        },
      },
    });
  } catch (error) {
    return ServerError(res, error.message);
  }
};
const populateAddress = async (orders) => {
  let orderPromises = [];
  orders.forEach((order) => {
    const newPromise = new Promise((resolve, reject) => {
      Address.findOne({ "address._id": order.addressId })
        .populate("user", "firstName lastName email")
        .exec((error, userAddress) => {
          if (error) reject({ error });
          userAddress.address.forEach((adr) => {
            if (adr._id.toString() === order.addressId.toString()) {
              order.address = adr;
            }
          });
          resolve(order);
        });
    });
    orderPromises.push(newPromise);
  });
  const newOrders = await Promise.all(orderPromises)
    .then((response) => response)
    .catch((error) => error);
  return newOrders;
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
  const data = { days: [], revenue: [] };
  const result = [];
  for (let subtractDays = 7; subtractDays >= 1; subtractDays--) {
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - subtractDays);
    const temp = startDate;
    data.days.push(moment(startDate).format("DD-MM-YYYY"));
    startDate.setUTCHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setDate(endDate.getDate() - subtractDays);
    endDate.setUTCHours(23, 59, 59, 999);

    const totalPrice = totalOrderPriceInDateRange(startDate, endDate);
    result.push(totalPrice);
  }
  const final = await Promise.all(result);

  //sẽ có ngày ế không bán được thì thống kê trả về mảng rỗng nên phải set 0 cho những ngày đó
  data.revenue = final.map((data) => (data.length > 0 ? data[0].total : 0));
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
  const revenues = final.map((data) => (data.length > 0 ? data[0].total : 0));
  return { year, revenues };
}

async function top5HotProduct() {
  const products = await Product.find({})
    .sort({ quantitySold: -1 })
    .limit(5)
    .exec();

  const result = { products: [], quantitySold: [] };

  products.forEach((product) => {
    result.products.push(product.name);
    result.quantitySold.push(product.quantitySold);
  });

  return result;
}
