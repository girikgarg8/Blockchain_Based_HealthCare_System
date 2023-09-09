var { _hash } = require('./lib');
var { TP_NAMESPACE } = require('./constants');
var serialise = require('./serialiser');

class PayloadStore {
    constructor(context) {
        this.context = context;
        this.timeout = 500;
    }

    async addPayload(payloadObj) {
        let address = payloadAddress(payloadObj.localNodeId);
        let payloadObject = {};
        payloadObject.localNodeId = payloadObj.localNodeId;
        payloadObject.globalNodeId = payloadObj.partyId;
        payloadObject.payloadMessage= payloadObj.payloadMessage;
        let data = Buffer.from(serialise(payloadObj));
        return await this.context.setState({ [address]: data }, this.timeout);
    }

    async payloadExists(localNodeId) {
        const address = payloadAddress(localNodeId);
        const payloadInfo = await this.context.getState([address], this.timeout);
        const payload = payloadInfo[address];
        if (Buffer.isBuffer(payload)) {
            return true;
        } else {
            return false;
        }
    }

    async getPayload(localNodeId) {
        const address = payloadAddress(localNodeId);
        const payloadInfo = await this.context.getState([address], this.timeout);
        const payload = payloadInfo[address][0];
        if (Buffer.isBuffer(payload)) {
            const json = payloadInfo.toString();
            const payload = JSON.parse(json);
            return payload;
        } else {
            return false;
        }
    }
}

const payloadAddress = localNodeId => TP_NAMESPACE + '10' + _hash(localNodeId).substring(0, 62);

module.exports = PayloadStore;