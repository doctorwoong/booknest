const axios = require("axios");
const request = require("request");

const OMNI_API_BASE_URL = "https://omni.ibapi.kr";
const USER_NAME = "admi_om_61697p63";
const PASSWORD = "ZPCX6DQ6FLEVFKKQHMLU";

/**
 * 📌 Access Token 발급 함수
 */
async function getAccessToken() {
    try {
        const response = await axios.post(`${OMNI_API_BASE_URL}/v1/auth/token`, null, {
            headers: {
                "X-IB-Client-Id": USER_NAME,
                "X-IB-Client-Passwd": PASSWORD,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        });
        return response.data?.data?.token;
    } catch (error) {
        console.error("🚨 [AccessToken] 요청 실패:", error.message);
        throw error;
    }
}

/**
 * 📦 문자 전송 함수 (국내/국제 지원)
 * @param {Object} param
 * @param {string} param.to - 수신자 번호
 * @param {string} [param.from="16661734"] - 발신 번호
 * @param {string} param.content - 메시지 내용
 * @param {boolean} [param.isInternational=false] - 국제문자인지 여부
 */
async function sendSMS({ to, from = "16661734", content, isInternational }) {
    try {
        const token = await getAccessToken();
        console.log("수신자 번호:", to);
        console.log("국제문자 여부?:", isInternational);

        const url = isInternational
            ? `${OMNI_API_BASE_URL}/v1/send/international`
            : `${OMNI_API_BASE_URL}/v1/send/sms`;

        console.log("호출 endpoint:", url);

        const payload = {
            from: from,
            text: content,
            to: to,
            ref: "참조필드"
        };

        const options = {
            method: 'POST',
            url,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        return new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (error) return reject(error);
                console.log("✅ 문자 전송 응답:", body);
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body); // JSON 파싱 실패 시 원본문자
                }
            });
        });
    } catch (error) {
        console.error("🚨 [SMS] 전송 실패:", error.message);
        throw error;
    }
}

module.exports = {
    sendSMS,
};
