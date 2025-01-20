const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { generateContract, sendEmails } = require("./mail"); // mail.js 호출
const app = express();
const { getMainRoom , insertReservation , getCheckInCustomers , getCheckOutCustomers
        , getCheckCustomers , getReviews ,deleteReservation,getReviewCustomer , getCustmerReview ,updateReview , writeReview ,deleteReview} = require('./controller/controller');

// express.json() 또는 body-parser 미들웨어가 누락되었을 수 있음. 서버에서 요청 본문을 파싱하음록 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/proxy', async (req, res) => {
    const { url } = req.query; // 요청된 URL
    try {
        const response = await axios.get(url);
        res.send(response.data); // 데이터를 React 앱으로 전달
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

// /send-reservation 라우트
app.post("/send-reservation", async (req, res) => {
    console.log("받은 데이터 :", JSON.stringify(req.body, null, 2));
    const { name, phone, email,passport, checkInDate, checkOutDate, title, price } = req.body;

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

    console.log("메일에 쏘는 데이터 :", JSON.stringify(contractData, null, 2));

    try {
        const contractPath = await generateContract(contractData);
        await sendEmails("admin@teamtoys.com", email, contractPath, contractData);
        res.status(200).send("이메일 전송 성공");
    } catch (error) {
        console.error(error);
        res.status(500).send("이메일 전송 실패");
    }
});

// MainRoom 라우트
app.post('/MainSearch', getMainRoom); //메인 리스트 조회
app.post('/insert-reservation', insertReservation); //예약 완료시 고객테이블 예약자 추가
app.post('/check-in', getCheckInCustomers); // 예약완료 고객 조회 (체크인)
app.post('/check-out', getCheckOutCustomers); // 예약완료 고객 조회 (체크아웃)
app.post('/check', getCheckCustomers); // 예약완료 고객 조회 (체크아웃)
app.post('/delete-reservation', deleteReservation); // 예약 취소
app.post('/review', getReviewCustomer); //리뷰고객조회
app.post('/updateReview', updateReview); //리뷰 수정
app.post('/writeReview', writeReview); //리뷰 작성
app.post('/deleteReview', deleteReview); //리뷰 삭제
app.get('/api/reviews/:roomNumber', getReviews); // 객실 리뷰데이터 조회
app.get('/review/:customer_id', getCustmerReview); // 고객 리뷰 디테일 조회

const PORT = 30021;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
