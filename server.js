require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require("fs");
const { generateContract, sendEmails , sendCheckInEmail, sendCancelEmail } = require("./mail");
const { sendSMS, sendCancelSMS } = require("./sendSMS");

// 컨트롤러/서비스 모듈 import
const {
    getMainRoom, insertReservation, getCheckInCustomers, getCheckOutCustomers, getCheckCustomers,
    getReviews, deleteReservation, getReviewCustomer, getCustmerReview, updateReview, writeReview,
    deleteReview, getReservationCustomers, updateCheckInMailStatus, updateCheckOutMailStatus,
    updateReservationMailStatus, updateCheckInSmsStatus, updateCheckOutSmsStatus,
    getCalendarAdmin, getCalendarAirbnb, getUnavailablePeriods, getReservationById,
    updateReservation, addUnavailablePeriod, deleteUnavailablePeriod,
    updateExternalReservation, getCalendarDataForUnavailable, getInquiry, insertInquiry,
    getInquiryDetail, getInquiryComment, insertInquiryComment
} = require('./controller');

const {
    generateAndSaveIcal, manualBookingSync, fetchAndStoreBookingBookings,
    checkOverbooking, checkAllOverbookingsController, checkRoomOverbookingsController
} = require('./bookingSync');

// ----------------------
// Express 설정
// ----------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ----------------------
// 라우트
// ----------------------

// Proxy
app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await axios.get(url);
        res.send(response.data);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send('Error fetching data');
    }
});

// 예약 메일 전송
app.post("/send-reservation", async (req, res) => {
    const { name, phone, email, passport, checkInDate, checkOutDate, title, price } = req.body;
    if (!name || !phone || !email || !checkInDate || !checkOutDate || !title || !price) {
        return res.status(400).json({ error: "필수 데이터가 누락되었습니다." });
    }

    const contractData = { name, phone, passport, checkInDate, checkOutDate, date: new Date().toLocaleDateString(), title, price };

    try {
        const contractPath = await generateContract(contractData);
        await sendEmails("bakho2@naver.com", email, contractPath, contractData);
        res.status(200).json({ message: "이메일 전송 성공" });
    } catch (error) {
        console.error("이메일 전송 실패:", error.message);
        res.status(500).json({ error: "이메일 전송 실패" });
    }
});

// 체크인/취소 이메일
app.post("/send-check-in-email", async (req, res) => {
    try {
        const { email, room } = req.body;
        await sendCheckInEmail(email, room);
        res.status(200).json({ message: "이메일 전송 성공" });
    } catch (error) {
        console.error("이메일 전송 실패:", error.message);
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

// SMS
app.post("/send-check-in-sms", async (req, res) => {
    const { phone, message, imgUrl } = req.body;
    try {
        const result = await sendSMS({ to: phone, content: message, imgUrl });
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

// 예약/리뷰 관련 API
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

// 예약 수정 API
app.get('/reservation/:customer_id', getReservationById);
app.post('/update-reservation', updateReservation);
app.post('/update-external-reservation', updateExternalReservation);

// 예약불가 기간
app.post('/add-unavailable-period', addUnavailablePeriod);
app.delete('/delete-unavailable-period/:customer_id', deleteUnavailablePeriod);

// 오버부킹 체크 API
app.get('/check-all-overbookings', checkAllOverbookingsController);
app.get('/check-room-overbookings/:roomNumber', checkRoomOverbookingsController);

// 문의게시판
app.get('/inquiry-list', getInquiry);
app.post('/inquiry-insert', insertInquiry);
app.get('/inquiry/:id', getInquiryDetail);
app.get('/inquiry-comments/:id', getInquiryComment);
app.post('/inquiry-comment-insert', insertInquiryComment);

// iCal 내보내기
app.get('/export-ical/:roomNumber?', async (req, res) => {
    try {
        const { roomNumber } = req.params;
        const result = await generateAndSaveIcal(roomNumber);
        if (!result) return res.status(404).json({ error: '내보낼 예약이 없습니다.' });

        const fileContent = fs.readFileSync(result.filePath, 'utf8');
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(fileContent);
    } catch (error) {
        console.error('iCal 내보내기 오류:', error);
        res.status(500).json({ error: 'iCal 내보내기 실패' });
    }
});

// Booking.com 수동 동기화
app.get('/manual-booking-sync', async (req, res) => {
    try {
        const { action } = req.query;
        if (action === 'export_all') {
            const result = await manualBookingSync();
            res.json({ success: true, message: 'Booking.com으로 예약정보 전송 완료', files: result.files || [] });
        } else {
            res.status(400).json({ error: '잘못된 액션입니다.' });
        }
    } catch (error) {
        console.error('Booking.com 수동 전송 오류:', error);
        res.status(500).json({ error: 'Booking.com 전송 실패' });
    }
});

// 실시간 Booking.com 동기화
app.post("/sync-booking-realtime", async (req, res) => {
    try {
        const result = await fetchAndStoreBookingBookings(true);
        res.json({ success: result.success, message: result.success ? "Booking.com 동기화 완료" : "동기화 중 일부 오류", ...result });
    } catch (error) {
        console.error("실시간 Booking.com 동기화 실패:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 오버부킹 체크 (예약 시)
app.post("/check-overbooking", async (req, res) => {
    try {
        const { roomNumber, checkIn, checkOut } = req.body;
        if (!roomNumber || !checkIn || !checkOut) {
            return res.status(400).json({ success: false, error: "객실번호, 체크인, 체크아웃 날짜가 필요합니다." });
        }
        const result = await checkOverbooking(roomNumber, checkIn, checkOut);
        if (result.isOverbooked) {
            res.json({ success: false, isOverbooked: true, message: "해당 날짜에 이미 예약이 있습니다.", conflictingReservations: result.conflictingReservations });
        } else {
            res.json({ success: true, isOverbooked: false, message: "예약 가능한 날짜입니다." });
        }
    } catch (error) {
        console.error("오버부킹 체크 실패:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ----------------------
// 서버 실행
// ----------------------
const PORT = 30021;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Proxy server running on port ${PORT}`));
