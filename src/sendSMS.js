const axios = require('axios');
const API_URL = "https://message.ppurio.com";
const USER_NAME = "airbnb12";
const TOKEN = "1b923c26a27bb2de6db4e593a464b2f8a0834729147ea8c34cd6017ecee1b407";

const getAccessToken = async () => {
    const response = await axios.post(`${API_URL}/v1/token`, null, {
        auth: {
            username: USER_NAME,
            password: TOKEN,
        },
    });

    return response.data.token;
};

/**
 * LMS 문자 전송
 */
const sendSMS = async ({ to, content, refKey = "ref_key", sendTime = null }) => {
    const token = await getAccessToken();

    const payload = {
        account: USER_NAME,
        messageType: "SMS",
        content,
        from: "01082227855",
        duplicateFlag: "N",
        rejectType: "AD",
        refKey,
        targetCount: 1,
        targets: [{ to, name: "고객" }],
    };

    if (sendTime) {
        payload.sendTime = sendTime;
    }

    const response = await axios.post(`${API_URL}/v1/message`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    return response.data;
};

module.exports = {
    sendSMS,
    getAccessToken,
};
