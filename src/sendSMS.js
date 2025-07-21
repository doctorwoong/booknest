const axios = require("axios");
var request = require('request');

const OMNI_API_BASE_URL = "https://omni.ibapi.kr";
const USER_NAME = "admi_om_61697p63"; // 연동 계정 아이디
const PASSWORD = "ZPCX6DQ6FLEVFKKQHMLU"; // 연동 계정 비밀번호

/**
 * 📌 Access Token 발급 함수
 * @returns {Promise<string>} access token
 */
async function getAccessToken() {
    try {
        console.log("🔑 AccessToken 요청 시작...");
        console.log(`🌐 요청 URL: ${OMNI_API_BASE_URL}/v1/auth/token`);
        console.log(`👤 계정: ${USER_NAME}`);

        const response = await axios.post(`${OMNI_API_BASE_URL}/v1/auth/token`, null, {
            headers: {
                "X-IB-Client-Id": USER_NAME,
                "X-IB-Client-Passwd": PASSWORD,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        });

        console.log("✅ AccessToken 응답:", response.data);

        // 토큰 추출 방식 수정
        return response.data?.data?.token;
    } catch (error) {
        console.error("🚨 [AccessToken] 요청 실패:");
        if (error.response) {
            console.error("🔻 status:", error.response.status);
            console.error("🔻 data:", error.response.data);
        } else if (error.request) {
            console.error("🔻 요청은 되었으나 응답 없음:", error.request);
        } else {
            console.error("🔻 오류 메시지:", error.message);
        }
        throw error;
    }
}


/**
 * 📦 국제 문자 전송 함수 (OMNI API 사용)
 * @param {Object} param
 * @param {string} param.to - 수신자 번호 (국가코드 포함, 예: +821012341234)
 * @param {string} [param.from="8216661734"] - 발신 번호
 * @param {string} param.text - 전송할 문자 메시지 내용
 * @returns {Promise<Object>} API 응답
 */
async function sendSMS({ to, from = "16661734", content }) {
    try {
        console.log("✉️ 문자 전송 요청 시작...");
        console.log("➡️ 수신자:", to);
        console.log("➡️ 발신자:", from);
        console.log("➡️ 내용:", content);

        const token = await getAccessToken();

        var options = {
            'method': 'POST',
            'url': 'https://omni.ibapi.kr/v1/send/international',
            'headers': {
                'Authorization': 'Bearer ' + token ,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                from: from,
                text: content,
                to: to,
                ref: "참조필드"
            })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
        });

        console.log("✅ 문자 전송 응답:", options);
        return options.data;
    } catch (error) {
        console.error("🚨 [SMS] 전송 실패:");
        if (error.response) {
            console.error("🔻 status22:", error.response.status);
            console.error("🔻 data22:", error.response.data);
        } else if (error.request) {
            console.error("🔻 요청은 되었으나 응답 없음:", error.request);
        } else {
            console.error("🔻 오류 메시지:", error.message);
        }
        throw error;
    }
}

module.exports = {
    sendSMS,
};
