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
 */
async function sendSMS({ to, from = "16661734", content }) {
    try {
        const token = await getAccessToken();
        console.log("수신자 번호:", to);

        const url = `${OMNI_API_BASE_URL}/v1/send/sms`;

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
                Accept: 'application/json',
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