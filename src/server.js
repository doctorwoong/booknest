const express = require('express');
const cors = require('cors');
const ical = require("node-ical");
const axios = require('axios');
const { generateContract, sendEmails , sendCheckInEmail} = require("./mail"); // mail.js 호출
const app = express();
const { getMainRoom, insertReservation, getCheckInCustomers, getCheckOutCustomers, getCheckCustomers,
    getReviews, deleteReservation, getReviewCustomer, getCustmerReview, updateReview, writeReview,
    deleteReview, getReservationCustomers, updateCheckInMailStatus, updateCheckOutMailStatus,
    updateReservationMailStatus, updateCheckInSmsStatus, updateCheckOutSmsStatus } = require('./controller/controller');

// express.json() 또는 body-parser 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const accessKey = "ncp_iam_BPAMKR1QoJPe4uNkpFuh";
const secretKey = "ncp_iam_BPKMKRIZfBstDm6BrAze6KwUhnBA1mwhae";
const serviceId = "ncp:sms:kr:347789811324:airbnb";
const sender = process.env.NCLOUD_SENDER;

async function sendMessage(to, message, type, imageUrl = "") {
    const timestamp = Date.now().toString();
    const url = `/sms/v2/services/${serviceId}/messages`;
    const fullUrl = `https://sens.apigw.ntruss.com${url}`;
    const method = "POST";
    const space = " ";
    const newLine = "\n";
    const hmac = crypto.createHmac("sha256", secretKey);
    hmac.update(method + space + url + newLine + timestamp + newLine + accessKey);
    const signature = hmac.digest("base64");

    // ✅ SMS (체크아웃) / MMS (체크인) 타입 구분
    const payload = {
        type, // "SMS" 또는 "MMS"
        contentType: "COMM",
        countryCode: "82",
        from: sender,
        content: message,
        messages: [{ to }],
    };

    if (type === "MMS" && imageUrl) {
        payload.messages[0].image = imageUrl; // ✅ MMS일 때만 이미지 추가
    }

    try {
        const response = await axios.post(fullUrl, payload, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "x-ncp-apigw-timestamp": timestamp,
                "x-ncp-iam-access-key": accessKey,
                "x-ncp-apigw-signature-v2": signature,
            },
        });
        return response.data;
    } catch (error) {
        console.error("메시지 전송 오류:", error.response?.data || error.message);
        return null;
    }
}

// 📌 프록시 요청 (React에서 API 호출 시 필요)
app.get('/proxy', async (req, res) => {
    const { url } = req.query; // 요청된 URL
    try {
        const response = await axios.get(url);
        res.send(response.data); // 데이터를 React 앱으로 전달
    } catch (error) {
        console.error("🔴 Proxy Error:", error.message);
        res.status(500).send('Error fetching data');
    }
});

// 📌 예약 메일 전송
app.post("/send-reservation", async (req, res) => {
    console.log("📩 받은 데이터 :", JSON.stringify(req.body, null, 2));

    const { name, phone, email, passport, checkInDate, checkOutDate, title, price } = req.body;

    if (!name || !phone || !email || !passport || !checkInDate || !checkOutDate || !title || !price) {
        return res.status(400).json({ error: "🚨 필수 데이터가 누락되었습니다." });
    }

    const contractData = {
        name,
        phone,
        passport,
        checkInDate,
        checkOutDate,
        date: new Date().toLocaleDateString(),
        title,
        price
    };

    console.log("📨 메일에 전송할 데이터 :", JSON.stringify(contractData, null, 2));

    try {
        const contractPath = await generateContract(contractData); // PDF 계약서 생성
        console.log("📄 계약서 생성 완료:", contractPath);

        await sendEmails("admin@teamtoys.com", email, contractPath, contractData);
        console.log("✅ 이메일 전송 성공");

        res.status(200).json({ message: "이메일 전송 성공" });
    } catch (error) {
        console.error("🚨 이메일 전송 실패:", error.message);
        res.status(500).json({ error: "이메일 전송 실패" });
    }
});

// ✅ 체크인 이메일 (이미지 포함)
app.post("/send-check-in-email", async (req, res) => {
    console.log("📩 받은 데이터 (체크인) :", JSON.stringify(req.body, null, 2));

    const { email, room} = req.body;

    try {
        await sendCheckInEmail(email, room);
        console.log("✅ 이메일 전송 성공");

        res.status(200).json({ message: "이메일 전송 성공" });
    } catch (error) {
        console.error("🚨 이메일 전송 실패:", error.message);
        res.status(500).json({ error: "이메일 전송 실패" });
    }
});

// 📌 기타 API 라우트 설정
app.post('/MainSearch', getMainRoom);
app.post('/insertReservation', insertReservation);
app.post('/check-in', getCheckInCustomers);
app.post('/check-out', getCheckOutCustomers);
app.post('/check', getCheckCustomers);
app.post('/delete-reservation', deleteReservation);
app.post('/review', getReviewCustomer);
app.post('/updateReview', updateReview);
app.post('/writeReview', writeReview);
app.post('/deleteReview', deleteReview);
app.post('/getReservation', getReservationCustomers);
app.get('/api/reviews/:roomNumber', getReviews);
app.get('/review/:customer_id', getCustmerReview);
app.post('/updateCheckInMailStatus', updateCheckInMailStatus);
app.post('/updateCheckOutMailStatus', updateCheckOutMailStatus);
app.post('/updateReservationMailStatus', updateReservationMailStatus);

app.post('/updateCheckInSmsStatus', updateCheckInSmsStatus);
app.post('/updateCheckOutSmsStatus', updateCheckOutSmsStatus);



const PORT = 30022;
app.listen(PORT, () => console.log(`🚀 Proxy server running on port ${PORT}`));
