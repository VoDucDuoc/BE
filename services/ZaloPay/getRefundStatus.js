const axios = require('axios').default; // npm install axios
const CryptoJS = require('crypto-js'); // npm install crypto-js

exports.getRefundStatus = (refundId) => {
  const params = {
    appid:process.env.ZALO_APPID,
    timestamp: Date.now(), // miliseconds
    mrefundid: refundId,
  };

  const data = params.appid + "|" + params.mrefundid + "|" + params.timestamp; // appid|mrefundid|timestamp
  params.mac = CryptoJS.HmacSHA256(data, process.env.ZALO_KEY_FOR_SERVER_REQUEST).toString()

  axios.get(process.env.ZALO_GET_REFUND_STATUS_API, { params })
    .then(res => Get(res,res.data))
    .catch(err => ServerError(res,err.messages));
}
