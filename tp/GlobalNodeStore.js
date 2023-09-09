var { _hash } = require('./lib');
var { TP_NAMESPACE } = require('./constants');
var serialise = require('./serialiser');

class GlobalNodeStore {
    constructor(context) {
        this.context = context;
        this.timeout = 500;
    }
 
    async addPayloadToGlobalNode(globalNodeId,payload) { 
        let globalNode = await this.getGlobalNode(globalNodeId);
        globalNode.payload=payload;
        return await this.addGlobalNode(globalNode);
    }

    async addGlobalNode(globalNode) {
        const address = globalNodeAddress(globalNode.globalNodeId);
        let globalNodeInfo = { globalNodeId: globalNode.globalNodeId };
        let serialised = serialise(globalNodeInfo);
        console.log(serialised);
        let data = Buffer.from(serialised);
        return await this.context.setState({ [address]: data }, this.timeout);
    }

    async globalNodeExists(globalNodeId) {
        const address = globalNodeAddress(globalNodeId);
        let globalNodeInfo = await this.context.getState([address], this.timeout);
        const globalNode = globalNodeInfo[address][0];
        if (globalNode == undefined || globalNode== null) {
            return false;
        } else {
            return true;
        }
    }

    async getGlobalNode(globalNodeId) {
        const address = globalNodeAddress(globalNodeId);
        let globalNodeInfo = await this.context.getState([address], this.timeout);
        const nodeData = globalNodeInfo[address];
        if (Buffer.isBuffer(nodeData)) {
            const json = nodeData.toString();
            const globalNode = JSON.parse(json);
            return globalNode;
        } else {
            return undefined;
        }
    }
}

const globalNodeAddress = globalNodeId => TP_NAMESPACE + '01' + _hash(globalNodeId).substring(0, 62);

module.exports = GlobalNodeStore;
