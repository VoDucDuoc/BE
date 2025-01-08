const CryptoJS = require('crypto-js');

class ZaloHMC {
    encrypt(data, key = process.env.ZALO_KEY_FOR_SERVER_REQUEST) {
        return CryptoJS.HmacSHA256(data, key).toString();
    }

    _createOrderMACData(order) {
        return order.appid + "|"
            + order.apptransid + "|"
            + order.appuser + "|"
            + order.amount + "|"
            + order.apptime + "|"
            + order.embeddata + "|"
            + order.item;
    }

    createOrder(order) {
        return this.encrypt(_createOrderMACDate(order));
    }

    refund(refundInfo) {
        return this.encrypt
            (
                refundInfo.appid + "|"
                + refundInfo.zptransid + "|"
                + refundInfo.amount + "|"
                + refundInfo.description + "|"
                + refundInfo.timestamp
            );
    }

    getStatusOrder(orderInfo) {
        return this.encrypt
            (
                orderInfo.appid + "|"
                + orderInfo.apptransid + "|"
                + process.env.ZALO_KEY_FOR_SERVER_REQUEST
            );
    }

    getRefundStatus(refundinfo) {
        return this.encrypt
            (
                params.appid + "|"
                + params.mrefundid + "|"
                + params.timestamp
            );
    }
}

module.exports=new ZaloHMC();
