const cron = require("node-cron");
const ical = require("node-ical");
const mysql = require("mysql2/promise");

// MySQL 데이터베이스 연결 설정
const db = mysql.createPool({
    host: '211.254.214.79',
    user: 'aiabnb',
    password: 'Rkwoaos12!@',
    database: 'airbnb',
    timezone: '+09:00'
});

// 숙소별 iCal URL 목록
const airbnbListings = [
    { id: 1, name: "N303", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/990315601098043406.ics?s=567502002ef1cc2d2222d474fedbff5d" },
    { id: 2, name: "N306", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1122138059511745129.ics?s=70894734612ce6821bc7e1621af0b920" },
    { id: 3, name: "C106", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1164975305219859709.ics?s=14338df46767cf739d25949522a825df" },
    { id: 4, name: "C107", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1157707019200606598.ics?s=d8ef2227f0fc6191daa365ee6acfcac4" },
    { id: 5, name: "C201", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1181632561505166987.ics?s=8edb973219810877362b2613f8e61078" },
    { id: 6, name: "C302", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1158421184027547288.ics?s=83b0d667de49f25d926c7d1db7d7baf5" },
    { id: 7, name: "C305", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1181640463813981741.ics?s=14e5fff8182d77c50a5ceeae271fb19d" },
    { id: 8, name: "C402", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1170033877248041336.ics?s=bac144c32d535de8a42d589ccb69f0ea" },
    { id: 9, name: "N103", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1054141015778044220.ics?s=07d49a1b65a993722f3b917e2826c38e" },
    { id: 10, name: "N202", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/972128400649708960.ics?s=60ccd50829306585dfca31d39bf6b3a9" },
    { id: 11, name: "N203", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/710300489857621363.ics?s=b43a0e593c71034b9a7bfb39bbe0478b" },
    { id: 12, name: "N207", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/923342860749116606.ics?s=af311f64d039e8298433f57d8b1b100f" },
    { id: 13, name: "N307", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1016300595536228220.ics?s=19793335fd39211cfe56dbfd6e2060bd" },
    { id: 14, name: "R102", airbnbIcalUrl: "https://www.airbnb.co.kr/calendar/ical/1049749739738131515.ics?s=c6dbccd6c556f618ed1c453fb4bb1c78" },
];

// 📌 예약 데이터 테이블
const fetchAndStoreAirbnbBookings = async () => {
    try {
        console.log("🔄 Airbnb 캘린더 동기화 시작...");

        for (const listing of airbnbListings) {
            console.log(`📡 ${listing.name} (ID: ${listing.id}) 캘린더 가져오는 중...`);
            const events = await ical.async.fromURL(listing.airbnbIcalUrl);

            for (const event of Object.values(events)) {
                if (!event.start || !event.end) continue;

                const checkIn = event.start.toISOString().split("T")[0].replace(/-/g, ''); // YYYYMMDD 형식
                const checkOut = event.end.toISOString().split("T")[0].replace(/-/g, '');   // YYYYMMDD 형식

                // ✅ 예약이 DB에 있는지 확인 (중복 방지)
                const [existing] = await db.query(
                    "SELECT customer_id FROM CustomerInfo WHERE reserved_room_number = ? AND check_in = ? AND check_out = ?",
                    [listing.name, checkIn, checkOut]
                );

                if (existing.length === 0) {
                    // 🆕 새 예약 추가
                    await db.query(
                        `INSERT INTO CustomerInfo (
                            name,email,phone_number,passport_number,check_in,check_out,check_in_message_status,check_out_message_status,check_in_mail_status,check_out_mail_status,reservation_mail_status,reserved_room_number,review_id,totalprice,MDFY_DTM,MDFY_ID,REG_DTM,REG_ID
                        ) VALUES (
                          'batch','','','',?,?,'N','N','N','N','N',?,0,0,NOW(),'batch',NOW(),'batch')`,
                        [checkIn, checkOut,listing.name]
                    );
                    console.log(`✅ 새 예약 추가됨: ${listing.name} | ${checkIn} ~ ${checkOut}`);
                } else {
                    console.log(`🔄 기존 예약 있음: ${listing.name} | ${checkIn} ~ ${checkOut}`);
                }
            }
        }

        console.log("🎉 Airbnb 캘린더 동기화 완료!");
    } catch (error) {
        console.error("❌ Airbnb 캘린더 동기화 중 오류 발생:", error);
    }
};

// ⏰ 매일 새벽 1시 실행 (UTC 기준: 16:00 -> 한국 시간 01:00)
// cron.schedule("0 16 * * *", () => {
//     console.log("⏰ Airbnb 캘린더 동기화 배치 실행 중...");
//fetchAndStoreAirbnbBookings();
// });
fetchAndStoreAirbnbBookings();
console.log("🚀 Airbnb 캘린더 동기화 배치 작업이 설정되었습니다.");
