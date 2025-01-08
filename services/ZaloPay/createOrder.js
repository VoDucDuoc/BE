const axios = require('axios').default; // npm install axios
const CryptoJS = require('crypto-js'); // npm install crypto-js
const uuid = require('uuid').v1; // npm install uuid
const moment = require('moment'); // npm install moment
const { ServerError, BadRequest, Create, Get } = require("../../ulti/response");

exports.zaloCreateOrder = (orderIdFromServer, orderItemFromServer, orderPriceFromServer) => {
  const embed_data = {
    // merchantinfo: orderIdFromServer,
    redirecturl: "http://localhost:3001/",
  };

  const items = [
    ...orderItemFromServer
  ];

  const transID = Math.floor(Math.random() * 1000000);

  const order = {
    app_id: process.env.ZALO_APPID,
    app_trans_id: `${moment().format('YYMMDD')}_${transID}`, 
    app_user: "demo",
    app_time: Date.now(), 
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: orderPriceFromServer,
    description: `Lazada - Payment for the order #${transID}`,
    bank_code: "zalopayapp",
  };

  const data = process.env.ZALO_APPID + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time +
    "|" + order.embed_data + "|" + order.item;

  order.mac = CryptoJS.HmacSHA256(data, process.env.ZALO_KEY_FOR_SERVER_REQUEST).toString();

  return axios.post(process.env.ZALO_CREATE_ORDER_API, null, { params: order })
    .then(res => {
      res.data.apptransid = order.app_trans_id;
      return res.data;
    })
    .catch(err => err);
}