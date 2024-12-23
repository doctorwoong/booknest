const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
    const { url } = req.query; // 요청된 URL
    try {
        const response = await axios.get(url);
        res.send(response.data); // 데이터를 React 앱으로 전달
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

const PORT = 5005;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
