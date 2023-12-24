let blockchain = [];
let currentTransactions = [];

// Blockchain Functions

// Function to render transactions in the UI
function renderTransactions() {
    const transactionsElement = document.getElementById("transactions");
    transactionsElement.innerHTML = "";

    currentTransactions.forEach(transaction => {
        const listItem = document.createElement("li");

        // Decrypt the message and extract relevant parts
        const decryptedMessage = decrypt(transaction.message, transaction.receiverKeyPair.privateKey);
        const messageParts = decryptedMessage.split(':');
        const extractedMessage = messageParts.length >= 4 ? messageParts.slice(3).join(':') : '';

        // Display transaction details in the UI
        listItem.innerHTML = `
            <p>${transaction.sender} -> ${transaction.receiver}: ${transaction.amount} (${extractedMessage || 'No message'})</p>
            <p>Encrypted Message: ${JSON.stringify(transaction.message)}</p>
            <p>Decrypted Message: ${extractedMessage}</p>
        `;

        transactionsElement.appendChild(listItem);
    });
}

// Function to render key pairs in the UI
function renderKeyPairs() {
    const keyPairsBody = document.getElementById("keyPairsBody");
    keyPairsBody.innerHTML = "";

    currentTransactions.forEach(transaction => {
        const { sender, receiver } = transaction;
        const senderKeyPair = generateKeypair();
        const receiverKeyPair = generateKeypair();

        // Display key pairs in the UI
        const senderRow = document.createElement("tr");
        senderRow.innerHTML = `
            <td>${sender}</td>
            <td>${JSON.stringify(senderKeyPair.publicKey.n)}</td>
            <td>${JSON.stringify(senderKeyPair.privateKey.d)}</td>
        `;
        keyPairsBody.appendChild(senderRow);

        const receiverRow = document.createElement("tr");
        receiverRow.innerHTML = `
            <td>${receiver}</td>
            <td>${JSON.stringify(receiverKeyPair.publicKey.n)}</td>
            <td>${JSON.stringify(receiverKeyPair.privateKey.d)}</td>
        `;
        keyPairsBody.appendChild(receiverRow);
    });
}

// Function to render blockchain in the UI
function renderBlockchain() {
    const blockchainBody = document.getElementById("blockchainBody");
    if (!blockchainBody) {
        console.error("Blockchain body element not found.");
        return;
    }

    blockchainBody.innerHTML = "";

    blockchain.forEach(block => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${block.index}</td>
            <td>${block.timestamp}</td>
            <td>${block.transactions[0].sender}</td>
            <td>${JSON.stringify(block.transactions[0].senderKeyPair.publicKey.n)}</td>
            <td>${block.transactions[0].receiver}</td>
            <td>${JSON.stringify(block.transactions[0].receiverKeyPair.publicKey.n)}</td>
            <td>
                <ul>
                    ${block.transactions.map(transaction => `
                        <li>${transaction.sender} -> ${transaction.receiver}: ${transaction.amount} (${transaction.message || 'No message'})</li>
                    `).join('')}
                </ul>
            </td>
            <td>${block.previousHash}</td>
            <td>${block.hash}</td>
        `;
        blockchainBody.appendChild(row);
    });
}

// Function to add a new transaction to the current transactions
function addTransaction() {
    const sender = document.getElementById("sender").value;
    const receiver = document.getElementById("receiver").value;
    const amount = document.getElementById("amount").value;
    const message = document.getElementById("message").value;

    if (!sender || !receiver || !amount) {
        alert("Please fill in all required fields.");
        return;
    }

    const senderKeyPair = generateKeypair();
    const receiverKeyPair = generateKeypair();

    const encryptedMessage = encrypt(`${sender}:${receiver}:${amount}:${message}`, receiverKeyPair.publicKey);
    const signature = sign(`${sender}:${receiver}:${amount}:${message}`, senderKeyPair.privateKey);

    // Verify the signature before adding the transaction
    if (!verify(`${sender}:${receiver}:${amount}:${message}`, signature, senderKeyPair.publicKey)) {
        alert("Invalid signature. Transaction not added.");
        return;
    }

    // Add the transaction to the current transactions
    const transaction = {
        sender,
        receiver,
        amount,
        message: encryptedMessage,
        senderKeyPair,
        receiverKeyPair,
        signature
    };

    currentTransactions.push(transaction);
    renderTransactions();
    renderKeyPairs();
    renderBlockchain();

    // Clear form fields after adding a transaction
    document.getElementById("sender").value = "";
    document.getElementById("receiver").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("message").value = "";
}

async function mineBlock() {
    // Get the index for the new block
    const newIndex = blockchain.length + 1;

    const newTimestamp = new Date().toLocaleString();

    // Get the previous block in the blockchain
    const previousBlock = blockchain[blockchain.length - 1];

    const merkleRoot = calculateMerkleRoot(currentTransactions);

    // Determine the previous hash for the new block
    const previousHash = previousBlock ? previousBlock.hash : '0';

    const blockDataToHash = `${newIndex}${newTimestamp}${merkleRoot}${previousHash}`;

    const newHash = CryptoJS.SHA256(blockDataToHash).toString();

    const newBlock = {
        index: newIndex,
        timestamp: newTimestamp,
        transactions: currentTransactions,
        previousHash: previousHash,
        hash: newHash
    };

    // Add the new block to the blockchain
    blockchain.push(newBlock);

    // Clear the current transactions list after mining
    currentTransactions = [];

    renderTransactions();
    renderKeyPairs();
    renderBlockchain();
}


function calculateMerkleRoot(transactions) {
    const concatenatedData = transactions.map(transaction =>
        `${transaction.sender}${transaction.receiver}${transaction.amount}${transaction.message || ''}`
    ).join('');
    return CryptoJS.SHA256(concatenatedData).toString();
}

function isPrime(n) {
    if (n <= 1) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
    }
    return true;
}

function generateKeypair() {
    let p = 0;
    let q = 0;

    while (!isPrime(p)) {
        p = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
    }

    while (!isPrime(q) || q === p) {
        q = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
    }

    const n = p * q;
    const phi = (p - 1) * (q - 1);

    let e = Math.floor(Math.random() * (phi - 2) + 2);

    while (gcd(e, phi) !== 1) {
        e = Math.floor(Math.random() * (phi - 2) + 2);
    }

    const d = modInverse(e, phi);

    return { publicKey: { n, e }, privateKey: { n, d } };
}

function gcd(a, b) {
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

function modInverse(a, m) {
    let m0 = m;
    let x0 = 0;
    let x1 = 1;

    while (a > 1) {
        const q = Math.floor(a / m);
        let temp = m;
        m = a % m;
        a = temp;
        temp = x0;
        x0 = x1 - q * x0;
        x1 = temp;
    }

    return x1 < 0 ? x1 + m0 : x1;
}

function modPow(base, exponent, modulus) {
    if (modulus === 1) return 0;
    let result = 1;
    base = base % modulus;

    while (exponent > 0) {
        if (exponent % 2 === 1) {
            result = (result * base) % modulus;
        }
        exponent = Math.floor(exponent / 2);
        base = (base * base) % modulus;
    }

    return result;
}

function encrypt(message, publicKey) {
    const { n, e } = publicKey;
    const encryptedMessage = [];

    for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i);
        const encryptedCharCode = modPow(charCode, e, n);
        encryptedMessage.push(encryptedCharCode);
    }

    return encryptedMessage;
}

function decrypt(encryptedMessage, privateKey) {
    const { n, d } = privateKey;
    let decryptedMessage = "";

    for (let i = 0; i < encryptedMessage.length; i++) {
        const encryptedCharCode = encryptedMessage[i];
        const decryptedCharCode = modPow(encryptedCharCode, d, n);
        decryptedMessage += String.fromCharCode(decryptedCharCode);
    }

    return decryptedMessage;
}

function sign(message, privateKey) {
    const { n, d } = privateKey;
    const signature = [];

    for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i);
        const signatureCharCode = modPow(charCode, d, n);
        signature.push(signatureCharCode);
    }

    return signature;
}

function verify(message, signature, publicKey) {
    const { n, e } = publicKey;
    let decryptedSignature = "";

    for (let i = 0; i < signature.length; i++) {
        const signatureCharCode = signature[i];
        const decryptedCharCode = modPow(signatureCharCode, e, n);
        decryptedSignature += String.fromCharCode(decryptedCharCode);
    }

    return decryptedSignature === message;
}

// Initial rendering
renderTransactions();
renderKeyPairs();
renderBlockchain();