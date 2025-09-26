const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require("axios");
const request = require("request");

const OMNI_API_BASE_URL = process.env.SMS_API_BASE_URL;
const USER_NAME = process.env.SMS_USER_NAME;
const PASSWORD = process.env.SMS_PASSWORD;

/**
 *  Access Token 발급 함수
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
        console.error("[AccessToken] 요청 실패:", error.message);
        throw error;
    }
}

/**
 * 문자 전송 함수 (국내/국제 지원)
 * @param {Object} param
 * @param {string} param.to - 수신자 번호
 * @param {string} [param.from="16661734"] - 발신 번호
 * @param {string} param.content - 메시지 내용
 */
async function sendSMS({ to, from = process.env.SMS_FROM_NUMBER || "16661734", content }) {
    try {
        const token = await getAccessToken();
        // console.log("수신자 번호:", to);

        const url = `${OMNI_API_BASE_URL}/v1/send/sms`;

        // console.log("호출 endpoint:", url);

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
                // console.log("문자 전송 응답:", body);
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body); // JSON 파싱 실패 시 원본문자
                }
            });
        });
    } catch (error) {
        console.error("[SMS] 전송 실패:", error.message);
        throw error;
    }
}

async function sendCancelSMS(resv) {
    // 환경변수에서 전화번호 가져오기 (개발/운영 환경 구분)
    const adminPhonesEnv = process.env.NODE_ENV === 'production' 
        ? process.env.ADMIN_PHONES 
        : process.env.ADMIN_PHONES_DEV;
    
    const ADMIN_PHONES = adminPhonesEnv 
        ? adminPhonesEnv.split(',').map(phone => phone.trim())
        : ["01082227855", "01062776765"]; // 기본값

    const {
        name,
        reserved_room_number: room,
        check_in,
        check_out,
    } = resv || {};

    const getByteLength = (str) => {
        return str.replace(/[^\x00-\x7F]/g, "**").length;
    };
    
    const createCancelMessage = (name, room, checkIn, checkOut) => {
        const baseMessage = `[예약취소]\n고객: ${name}\n객실: ${room}\n체크인: ${checkIn}\n체크아웃: ${checkOut}`;
        
        // 90바이트 이내면 그대로 반환
        if (getByteLength(baseMessage) <= 90) {
            return baseMessage;
        }
        
        // 90바이트 초과시 이름을 자르기
        const nameTruncate = (name, maxBytes) => {
            let result = '';
            for (let i = 0; i < name.length; i++) {
                const test = result + name[i];
                if (getByteLength(test) > maxBytes) break;
                result = test;
            }
            return result + '...';
        };
        
        // 이름을 점진적으로 자르면서 90바이트 이내로 맞추기
        for (let nameLength = name.length; nameLength > 0; nameLength--) {
            const truncatedName = nameTruncate(name, nameLength);
            const testMessage = `[예약취소]\n고객: ${truncatedName}\n객실: ${room}\n체크인: ${checkIn}\n체크아웃: ${checkOut}`;
            
            if (getByteLength(testMessage) <= 90) {
                return testMessage;
            }
        }
        
        // 최악의 경우 기본 메시지 반환
        return `[예약취소]\n고객: ...\n객실: ${room}\n체크인: ${checkIn}\n체크아웃: ${checkOut}`;
    };
    
    const formatFullDate = (dateStr) => {
        if (!dateStr || dateStr === "-") return "-";
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}-${month}-${day}`;
    };
    
    const text = createCancelMessage(
        name ?? "-",
        room ?? "-",
        formatFullDate(check_in),
        formatFullDate(check_out)
    );

    // 2개 번호에 각각 SMS 전송
    const results = [];
    for (const phone of ADMIN_PHONES) {
        try {
            const result = await sendSMS({ to: phone, content: text });
            results.push({ phone, success: true, result });
            console.log(`SMS 전송 성공: ${phone}`);
        } catch (error) {
            results.push({ phone, success: false, error: error.message });
            console.error(`SMS 전송 실패: ${phone}`, error.message);
        }
    }
    
    return results;
}

module.exports = {
    sendSMS,sendCancelSMS
};
