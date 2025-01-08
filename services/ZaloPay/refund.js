const axios = require('axios').default; // npm install axios
const CryptoJS = require('crypto-js'); // npm install crypto-js
const moment = require('moment'); // npm install moment

exports.refund = (orderZaloIdNeedRefund,refundMoney)=>{
    const config = {
        appid: "553",
        key1: "9phuAOYhan4urywHTh0ndEXiV3pKHr5Q",
        key2: "Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3",
        endpoint: "https://sandbox.zalopay.com.vn/v001/tpe/partialrefund"
      };
      
      const timestamp = Date.now();
      const uid = `${timestamp}${Math.floor(111 + Math.random() * 999)}`; // unique id
      
      let params = {
        appid: process.env.ZALO_APPID,
        mrefundid: `${moment().format('YYMMDD')}_${config.appid}_${uid}`,
        timestamp, // miliseconds
        zptransid: orderZaloIdNeedRefund,
        amount: refundMoney,
        description: 'ZaloPay Refund Demo',
      };
      
      // appid|zptransid|amount|description|timestamp
      let data = params.appid + "|" + params.zptransid + "|" + params.amount + "|" + params.description + "|" + params.timestamp;
      params.mac = CryptoJS.HmacSHA256(data, process.env.ZALO_KEY_FOR_SERVER_REQUEST).toString();
      
      axios.post(process.env.ZALO_CREATE_REFUND_API, null, { params })
      .then(res => Get(res,res.data))
      .catch(err => ServerError(res, err.messages));
}
