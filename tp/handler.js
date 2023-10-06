const { TransactionHandler } = require('sawtooth-sdk/processor/handler');
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const cbor = require('borc');
const GlobalNodeStore = require('./GlobalNodeStore');
const PayloadStore = require('./PayloadStore');
const LocalNodeStore = require('./LocalNodeStore');

var { TP_FAMILY, TP_NAMESPACE } = require('./constants');

class HealthCareSystemHandler extends TransactionHandler {
    constructor() {
        super(TP_FAMILY, ['1.0'], [TP_NAMESPACE]);
    }

    async handleAddGlobalNodeTransaction(context, payload) {
        const globalNodeStore = new GlobalNodeStore(context);
        const globalNodeExists = await globalNodeStore.globalNodeExists(payload.globalNodeId);
        if (globalNodeExists) {
            throw new InvalidTransaction(`Global Node  ${payload.globalNodeId} already exists!`);
        } else {
            return await globalNodeStore.addGlobalNode(payload);
        }
    }

    async handleAddLocalNodeTransaction(context, payload) {
        const localNodeStore = new LocalNodeStore(context);
        const localNodeExists = await localNodeStore.localNodeExists(payload.localNodeId);
        if (localNodeExists) {
            throw new InvalidTransaction(`Local Node with id: ${payload.localNodeId} already exists!`);
        } else {
            return await localNodeStore.addLocalNode(payload);
        }
    }

    async handleAddTransaction(context, payload) {
        const payloadStore = new PayloadStore(context);

        const payloadByLocalNodeExists = false; //can be removed or changed later, as per use case
        if (payloadByLocalNodeExists) {
            throw new InvalidTransaction(`Local node  with id: ${payload.localNodeId} has already sent a payload!`);
        } else {
            const localNodeStore = new LocalNodeStore(context);
            const localNodeStoreExists = await localNodeStore.localNodeExists(payload.localNodeId);
            if (!localNodeStoreExists) {
                throw new InvalidTransaction(`Local Node ${payload.localNodeId}' is not in records, rejecting the payload sent !!`);
            }

            await payloadStore.addPayload(payload);
            const globalNode = new GlobalNodeStore(context);
            const globalNodeExists = await globalNode.globalNodeExists(payload.globalNodeId);
            if (!globalNodeExists) {
                throw new InvalidTransaction(`Global Node ${payload.globalNodeId}' is not in records, rejecting the payload sent !! `);
            }
            // await payloadStore.addVoteToParty(payload.partyId); not needed
            return await localNodeStore.addLocalNode({ localNodeId: payload.localNodeId, sentPayload: true });
        }
    }

    async apply(transactionProcessRequest, context) {
        let payload = cbor.decode(transactionProcessRequest.payload);
        switch (payload.action) {
            case 'addGlobalNode':
                return await this.handleAddGlobalNodeTransaction(context, payload);
            case 'addLocalNode':
                return await this.handleAddLocalNodeTransaction(context, payload);
            case 'addPayload':
                return await this.handleAddTransaction(context, payload);
            default:
                throw new InvalidTransaction(
                    `Action must be add local node, add global node, add payload, and not ${payload.action}`
                );
        }
    }
}

module.exports = HealthCareSystemHandler;