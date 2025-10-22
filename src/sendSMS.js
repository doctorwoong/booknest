const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require("axios");

/**
 * 비즈고 SMS 전송 함수
 * @param {Object} param
 * @param {string|string[]} param.to - 수신자 번호(문자열 또는 배열)
 * @param {string} [param.from] - 발신 번호 (기본: .env의 SMS_FROM_NUMBER)
 * @param {string} param.content - 메시지 내용
 */
async function sendSMS({ to, from = process.env.SMS_FROM_NUMBER, content }) {
    const url = `${process.env.SMS_API_BASE_URL}/v1/send/omni`;

    //수신자 배열 처리
    const adminPhonesRaw =
        process.env.NODE_ENV === 'production'
            ? process.env.ADMIN_PHONES
            : process.env.ADMIN_PHONES_DEV;

    const adminPhones = adminPhonesRaw
        ? adminPhonesRaw.split(',').map((p) => p.trim())
        : [];

    const recipients = Array.isArray(to)
        ? to
        : to
            ? [to]
            : adminPhones;

    //destinations 배열 생성
    const destinations = recipients.map((num) => ({ to: num }));

    //BizGow 전송 스펙 구조
    const payload = {
        messageFlow: [
            {
                sms: {
                    from,
                    text: content,
                },
            },
        ],
        destinations,
    };

    console.log("📨 [발신번호]:", from);
    console.log("📨 [수신번호]:", recipients);
    console.log("📨 [전송 Payload]:", JSON.stringify(payload, null, 2));

    try {
        const res = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": process.env.SMS_TOKEN
            },
        });

        console.log("[BIZGOW SMS 응답 - 전체]", JSON.stringify(res.data, null, 2));

        return res.data;
    } catch (err) {
        console.error("[BIZGOW SMS 오류]", err.response?.data || err.message);
        throw err;
    }
}

module.exports = { sendSMS };
