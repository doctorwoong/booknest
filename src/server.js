// ✅ 환경변수 설정 (서버 관리자 설정 없이 코드에서 직접)
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { generateContract, sendEmails , sendCheckInEmail, sendCancelEmail} = require("./Mail"); // mail.js 호출
const { sendSMS, sendCancelSMS } = require("./sendSMS");
const app = express();
const { getMainRoom, insertReservation, getCheckInCustomers, getCheckOutCustomers, getCheckCustomers,
    getReviews, deleteReservation, getReviewCustomer, getCustmerReview, updateReview, writeReview,
    deleteReview, getReservationCustomers, updateCheckInMailStatus, updateCheckOutMailStatus,
    updateReservationMailStatus, updateCheckInSmsStatus, updateCheckOutSmsStatus,getCalendarAdmin,getCalendarAirbnb } = require('./controller/controller');

    // ✅ 환경변수 설정 (서버 관리자 설정 없이 코드에서 직접)
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// express.json() 또는 body-parser 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

    if (!name || !phone || !email || !checkInDate || !checkOutDate || !title || !price) {
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

        await sendEmails("bakho2@naver.com", email, contractPath, contractData);
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

// app.post("/send-check-in-sms", async (req, res) => {
//     const { phone, message,imgUrl, isInternational } = req.body;
//     console.log("보낼 휴대폰번호 : ",phone);
//     console.log("보낼 메세지 내용 : ",message);
//     console.log("바디에 뭐들엇냐 : ",req.body);
//
//     try {
//         const result = await sendSMS({
//             to: phone,
//             content: message, // 줄바꿈 HTML → 문자용
//             imgUrl : imgUrl,
//             isInternational : isInternational ?? true
//         });
//
//         res.json({ success: true, result });
//     } catch (error) {
//         console.error("SMS 전송 실패:", error.response?.data || error.message);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });


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

app.post('/calendar_admin', getCalendarAdmin);
app.post('/calendar_airbnb', getCalendarAirbnb);

app.get('/api/reviews/:roomNumber', getReviews);
app.get('/review/:customer_id', getCustmerReview);
app.post('/updateCheckInMailStatus', updateCheckInMailStatus);
app.post('/updateCheckOutMailStatus', updateCheckOutMailStatus);
app.post('/updateReservationMailStatus', updateReservationMailStatus);

app.post('/updateCheckInSmsStatus', updateCheckInSmsStatus);
app.post('/updateCheckOutSmsStatus', updateCheckOutSmsStatus);



const PORT = 30022;
app.listen(PORT, () => console.log(`🚀 Proxy server running on port ${PORT}`));
