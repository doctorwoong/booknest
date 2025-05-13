const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_URL = "https://message.ppurio.com";
const USER_NAME = "teamtoys12";
const TOKEN = "3611f197493ed0ba2ae94f3aeecd517398adbb38b0d17a216efb8784988d9409";

async function getAccessToken() {
    const response = await axios.post(`${API_URL}/v1/token`, null, {
        auth: {
            username: USER_NAME,
            password: TOKEN,
        },
    });

    return response.data.token;
}

/**
 * 문자 또는 이미지(MMS) 전송
 * @param {Object} param0
 * @param {string} param0.to 수신자 전화번호
 * @param {string} param0.content 메시지 내용
 * @param {string} [param0.imgUrl] 이미지 URL (있으면 MMS)
 * @param {string} [param0.refKey] 참조 키 (중복 방지)
 * @param {string} [param0.sendTime] 예약 전송 시간
 */
async function sendSMS({ to, content, imgUrl, refKey = "ref_key", sendTime = null }) {
    const token = await getAccessToken();

    const filePath = path.join(__dirname, "/resource/checkin_04.jpg");
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString("base64");
    const fileSize = fileBuffer.length;

    console.log("fileSize" , fileSize);

    const files = [
        {
            name: "air_checkin.jpeg",       // 파일명 (text, 최대 200자)
            size: fileSize,                 // 파일 크기 (byte)
            data: base64Image               // Base64로 인코딩한 이미지 데이터
        }
    ];

    const payload = {
        account: USER_NAME,
        messageType: imgUrl === 'Y' ? "MMS" : "LMS",
        content,
        from: "16661734",
        duplicateFlag: "N",
        rejectType: "AD",
        refKey,
        targetCount: 1,
        ...(imgUrl === 'Y'
            ? {
                // MMS일 경우만 files 포함
                files: files,
            }
            : {}), // LMS일 경우 files 포함 X
        targets: [
            {to, name: "고객"},
        ],
    };


    const response = await axios.post(`${API_URL}/v1/message`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    return response.data;
}

module.exports = { sendSMS };
