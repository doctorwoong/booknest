require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { generateContract, sendEmails , sendCheckInEmail, sendCancelEmail} = require("./mail"); // mail.js 호출
const app = express();
const { getMainRoom, insertReservation, getCheckInCustomers, getCheckOutCustomers, getCheckCustomers,
    getReviews, deleteReservation, getReviewCustomer, getCustmerReview, updateReview, writeReview,
    deleteReview, getReservationCustomers, updateCheckInMailStatus, updateCheckOutMailStatus,
    updateReservationMailStatus, updateCheckInSmsStatus, updateCheckOutSmsStatus,getCalendarAdmin,getCalendarAirbnb,
    getUnavailablePeriods, getReservationById, updateReservation, addUnavailablePeriod, deleteUnavailablePeriod,
    updateExternalReservation, getCalendarDataForUnavailable,getInquiry,insertInquiry,getInquiryDetail,getInquiryComment
    ,insertInquiryComment} = require('./controller');
const {sendSMS, sendCancelSMS} = require("./sendSMS");

// express.json() 또는 body-parser 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

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

app.post("/send-cancel-email", async (req, res) => {
    try {
        await sendCancelEmail(req.body);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/send-check-in-sms", async (req, res) => {
    const { phone, message, imgUrl } = req.body;

    try {
        const result = await sendSMS({
            to: phone,
            content: message, // 줄바꿈 HTML → 문자용
            imgUrl : imgUrl
        });

        res.json({ success: true, result });
    } catch (error) {
        console.error("SMS 전송 실패:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/send-cancel-sms", async (req, res) => {
    try {
        await sendCancelSMS(req.body);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
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
app.post('/calendar_admin', getCalendarAdmin);
app.post('/calendar_airbnb', getCalendarAirbnb);
app.post('/unavailable-periods', getUnavailablePeriods);
app.post('/getReservation', getReservationCustomers);
app.get('/api/reviews/:roomNumber', getReviews);
app.get('/review/:customer_id', getCustmerReview);
app.post('/updateCheckInMailStatus', updateCheckInMailStatus);
app.post('/updateCheckOutMailStatus', updateCheckOutMailStatus);
app.post('/updateReservationMailStatus', updateReservationMailStatus);
app.post('/updateCheckInSmsStatus', updateCheckInSmsStatus);
app.post('/updateCheckOutSmsStatus', updateCheckOutSmsStatus);


// 예약 수정 관련 API
app.get('/reservation/:customer_id', getReservationById);
app.post('/update-reservation', updateReservation);
app.post('/update-external-reservation', updateExternalReservation);

// 예약불가 기간 관련 API
app.post('/add-unavailable-period', addUnavailablePeriod);
app.delete('/delete-unavailable-period/:customer_id', deleteUnavailablePeriod);

//  오버부킹 체크 API
app.get('/check-all-overbookings', checkAllOverbookingsController);
app.get('/check-room-overbookings/:roomNumber', checkRoomOverbookingsController);

// 문의게시판 리스트
app.get('/inquiry-list', getInquiry);
app.post('/inquiry-insert', insertInquiry);
app.get('/inquiry/:id', getInquiryDetail);
app.get('/inquiry-comments/:id', getInquiryComment);
app.post('/inquiry-comment-insert', insertInquiryComment);

const { generateAndSaveIcal, manualBookingSync, fetchAndStoreBookingBookings, checkOverbooking, checkAllOverbookingsController, checkRoomOverbookingsController} = require('./bookingSync');
const fs = require("fs");

app.get('/check-all-overbookings', checkAllOverbookingsController);
app.get('/check-room-overbookings/:roomNumber', checkRoomOverbookingsController);

app.get('/export-ical/:roomNumber?', async (req, res) => {
    try {
        const { roomNumber } = req.params;
        const result = await generateAndSaveIcal(roomNumber);

        if (!result) {
            return res.status(404).json({ error: '내보낼 예약이 없습니다.' });
        }

        // 생성된 파일을 직접 응답으로 전송
        const fs = require('fs');
        const fileContent = fs.readFileSync(result.filePath, 'utf8');

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(fileContent);

    } catch (error) {
        console.error('iCal 내보내기 오류:', error);
        res.status(500).json({ error: 'iCal 내보내기 실패' });
    }
});

// ✅ Booking.com 수동 전송 엔드포인트
app.get('/manual-booking-sync', async (req, res) => {
    try {
        const { action } = req.query;

        if (action === 'export_all') {
            const result = await manualBookingSync();
            res.json({
                success: true,
                message: 'Booking.com으로 예약정보 전송 완료',
                files: result.files || []
            });
        } else {
            res.status(400).json({ error: '잘못된 액션입니다.' });
        }

    } catch (error) {
        console.error('Booking.com 수동 전송 오류:', error);
        res.status(500).json({ error: 'Booking.com 전송 실패' });
    }
});

// 📡 실시간 Booking.com 동기화 API (서버 부담 최소화)
app.post("/sync-booking-realtime", async (req, res) => {
    try {
        console.log("🔄 실시간 Booking.com 동기화 요청...");

        // Booking.com에서 최신 예약 정보 가져오기 (캐시 우선 사용)
        const { fetchAndStoreBookingBookings } = require('./bookingSync');
        const result = await fetchAndStoreBookingBookings(true); // 캐시 사용

        console.log("✅ 실시간 Booking.com 동기화 완료");
        res.json({
            success: result.success,
            message: result.success ? "Booking.com 동기화가 완료되었습니다." : "동기화 중 일부 오류가 발생했습니다.",
            timestamp: new Date().toISOString(),
            duration: result.duration,
            totalReservations: result.totalReservations,
            results: result.results
        });

    } catch (error) {
        console.error("❌ 실시간 Booking.com 동기화 실패:", error);
        res.status(500).json({
            success: false,
            error: "동기화 중 오류가 발생했습니다.",
            message: error.message
        });
    }
});

// 🚨 오버부킹 체크 API (우리 시스템 예약 시 사용)
app.post("/check-overbooking", async (req, res) => {
    try {
        const { roomNumber, checkIn, checkOut } = req.body;

        if (!roomNumber || !checkIn || !checkOut) {
            return res.status(400).json({
                success: false,
                error: "객실번호, 체크인, 체크아웃 날짜가 필요합니다."
            });
        }

        console.log(`🔍 오버부킹 체크 요청: ${roomNumber} | ${checkIn} ~ ${checkOut}`);

        // 오버부킹 체크 함수 import
        const { checkOverbooking } = require('./bookingSync');
        const result = await checkOverbooking(roomNumber, checkIn, checkOut);

        if (result.isOverbooked) {
            console.log(`🚨 오버부킹 감지: ${roomNumber} | ${checkIn} ~ ${checkOut}`);
            res.json({
                success: false,
                isOverbooked: true,
                message: "해당 날짜에 이미 예약이 있습니다.",
                conflictingReservations: result.conflictingReservations
            });
        } else {
            console.log(`✅ 예약 가능: ${roomNumber} | ${checkIn} ~ ${checkOut}`);
            res.json({
                success: true,
                isOverbooked: false,
                message: "예약 가능한 날짜입니다."
            });
        }

    } catch (error) {
        console.error("❌ 오버부킹 체크 실패:", error);
        res.status(500).json({
            success: false,
            error: "오버부킹 체크 중 오류가 발생했습니다.",
            message: error.message
        });
    }
});

const PORT = 30021;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Proxy server running on port ${PORT}`));
