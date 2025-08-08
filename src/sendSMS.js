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
 * 📦 문자 전송 함수 (국내/국제 지원)
 * @param {Object} param
 * @param {string} param.to - 수신자 번호
 * @param {string} [param.from="16661734"] - 발신 번호
 * @param {string} param.content - 메시지 내용
 * @param {boolean} [param.isInternational=false] - 국제문자인지 여부
 */
async function sendSMS({ to, from = "16661734", content }) {
    try {
        // 배열 - 각각 발송
        if (Array.isArray(to)) {
            const results = [];
            for (const num of to) {
                results.push(await sendSMS({ to: num, from, content }));
            }
            return results;
        }

        const token = await getAccessToken();
        const toStr = String(to || "");
        const isDomestic = toStr.startsWith("+8210") || toStr.startsWith("010");

        const url = isDomestic
            ? `${OMNI_API_BASE_URL}/v1/send/sms`
            : `${OMNI_API_BASE_URL}/v1/send/international`;

        const sendTo = isDomestic ? toDomesticKRMobile(to) : to;

        const payload = { from, text: content, to: sendTo, ref: "참조필드" };
        const options = {
            method: 'POST',
            url,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
        };

        return await new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) return reject(error);
                try { resolve(JSON.parse(body)); } catch { resolve(body); }
            });
        });
    } catch (error) {
        console.error("🚨 [SMS] 전송 실패:", error.message);
        throw error;
    }
}

// 헬퍼
function toDomesticKRMobile(e164) {
    const numStr = String(e164 || ""); // 항상 문자열로 변환
    if (numStr.startsWith("+8210")) {
        return "0" + numStr.slice(3); // +8210xxxx → 010xxxx
    }
    return numStr;
}

async function sendCancelSMS(resv) {
    const ADMIN_PHONES = ["01082227855", "01062776765"];

    console.log("resv문자정보",resv);

    const {
        name,
        reserved_room_number: room,
        check_in,
        check_out,
    } = resv || {};

    const text =
        `[예약 취소]\n` +
        `고객: ${name ?? "-"}\n` +
        `객실: ${room ?? "-"}\n` +
        `체크인: ${check_in ?? "-"} /\n 체크아웃: ${check_out ?? "-"}`;

    return await sendSMS({ to: ADMIN_PHONES, content: text });
}

module.exports = {
    sendSMS,sendCancelSMS
};