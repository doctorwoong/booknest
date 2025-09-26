import {db} from '../Util/dbconnect'
import {airbnbListings} from '../Util/data'

const ical = require("node-ical");

// Airbnb 예약 동기화 함수
const fetchAndStoreAirbnbBookings = async () => {
    try {
        console.log("Airbnb 캘린더 동기화 시작...");

        for (const listing of airbnbListings) {
            console.log(`${listing.name} 캘린더 가져오는 중...`);

            const events = await ical.async.fromURL(listing.airbnbIcalUrl);

            // 기존 예약 삭제
            await db.query(
                "DELETE FROM CustomerInfo WHERE reserved_room_number = ? AND name = 'batch'",
                [listing.name]
            );
            console.log(`기존 예약 삭제됨: ${listing.name}`);

            for (const event of Object.values(events)) {
                if (!event.start || !event.end) continue;

                const checkIn = new Date(event.start).toISOString().split("T")[0].replace(/-/g, '');
                const checkOut = new Date(event.end).toISOString().split("T")[0].replace(/-/g, '');

                await db.query(
                    `INSERT INTO CustomerInfo (
            name, email, phone_number, passport_number,
            check_in, check_out,
            check_in_message_status, check_out_message_status,
            check_in_mail_status, check_out_mail_status, reservation_mail_status,
            reserved_room_number, review_id, totalprice,
            MDFY_DTM, MDFY_ID, REG_DTM, REG_ID
          ) VALUES (
            'batch', '', '', '', ?, ?,
            'N', 'N', 'N', 'N', 'N',
            ?, 0, 0, NOW(), 'batch', NOW(), 'batch'
          )`,
                    [checkIn, checkOut, listing.name]
                );

                console.log(`예약 삽입됨: ${listing.name} | ${checkIn} ~ ${checkOut}`);
            }
        }

        console.log("Airbnb 캘린더 동기화 완료!");
    } catch (error) {
        console.error("오류 발생:", error);
    }
};

// 개발 시 수동 실행도 가능
fetchAndStoreAirbnbBookings();
