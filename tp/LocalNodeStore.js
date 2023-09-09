var { _hash } = require('./lib');
var { TP_NAMESPACE } = require('./constants');
var serialise = require('./serialiser');

class LocalNodeStore {
    constructor(context) {
        this.context = context;
        this.timeout = 500;
    }

    async addLocalNode(localNode) {
        let address = localNodeAddress(localNode.localNodeId);
        let localNodeInfo = {};
        localNodeInfo['localNodeId'] = localNode.localNodeId;
        localNode.sentPayload = localNode.sentPayload ? true : false;
        let data = Buffer.from(serialise(localNodeInfo));
        return await this.context.setState({ [address]: data }, this.timeout);
    }

    async localNodeExists(localNodeId) {
        var address = localNodeAddress(localNodeId);
        const localNodeInfo = await this.context.getState([address], this.timeout);
        const localNode = localNodeInfo[address];
        if (Buffer.isBuffer(localNode)) {
            return true;
        } else {
            return false;
        }
    }

    async getLocalNode(localNodeId) {
        var address = localNodeAddress(localNodeId);
        const localNodeInfo = await this.context.getState([address], this.timeout);
        const localNode = localNodeInfo[address];
        if (Buffer.isBuffer(localNode)) {
            const json = localNode.toString();
            let localNodeObj = JSON.parse(json);
            return localNodeObj;
        } else {
            return undefined;
        }
    }

    async addPayload(payloadObject) { //todo
        let address = localNodeAddress(payloadObject.localNodeId);
        let payloadObj = {};
        payloadObj['id'] = payloadObject.localNodeId; //todo
        payloadObj.sentPayload = true;
        payloadObj.sentTo = payloadObj.globalNodeId;
        payloadObj.payload=payloadObj.payload; //todo

        let data = Buffer.from(serialise(payloadObj));

        return await this.context.setState({ [address]: data }, this.timeout);
    }

    async hasSentPayload(localNodeId) {
        const localNode = await this.getLocalNode(localNodeId);
        if (localNode) return localNode.sentPayload;
        else return false;
    }
}
const localNodeAddress = localNodeId => TP_NAMESPACE + '00' + _hash(localNodeId).substring(0, 62);

module.exports = LocalNodeStore;
