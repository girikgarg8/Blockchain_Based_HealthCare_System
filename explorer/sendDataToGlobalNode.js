// //We will simply fetch contents of blockchain and display them here..
const { spawn } = require('child_process');
const lget = require('lodash/get');
const axios = require('axios');

const instance = axios.create({
    baseURL: 'http://localhost:8008/',
    timeout: 1000,
    headers: { 'X-Custom-Header': 'foobar' },
});

var payloadArray=[];

instance
    .get('/state', {
        params: {
            address: '71c0c010',
        },
    })
    .then(response => {
        let data = lget(response, 'data.data');
        for (party of data) {
            const partyData = party.data;
            const buf = Buffer.from(partyData, 'base64');
            var jsonObject=JSON.parse(buf.toString());
            payloadArray.push(jsonObject);
        }

        // Spawn a Python child process
        const pythonProcess = spawn('python3', ['python_receiver.py']);

        // // Send the array to the Python process
        pythonProcess.stdin.write(JSON.stringify(payloadArray));
        pythonProcess.stdin.end();

        //  Listen for output from the Python process
        pythonProcess.stdout.on('data', (data) => {
            const result = data.toString();
            console.log(`${result} \n \n`);
        });

        // Handle errors
        pythonProcess.on('error', (err) => {
            console.error(`Error: ${err}`);
        });
    });

