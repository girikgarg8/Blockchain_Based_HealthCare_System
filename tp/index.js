const { TransactionProcessor } = require('sawtooth-sdk/processor');
const  HealthCareSystemHandler= require('./handler');
const transactionProcessor = new TransactionProcessor('tcp://localhost:4004');

transactionProcessor.addHandler(new HealthCareSystemHandler());
transactionProcessor.start();

console.log(`Welcome to Blockchain based healthcare system -- CPG 29`);
console.log(`Connecting to Sawtooth validator at tcp://localhost:4004`);
