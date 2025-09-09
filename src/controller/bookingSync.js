const cron = require("node-cron");
const ical = require("node-ical");
const mysql = require("mysql2/promise");

// ✅ MySQL 연결 설정
const db = mysql.createPool({
    host: '211.254.214.79',
    user: 'aiabnb',
    password: 'Rkwoaos12!@',
    database: 'airbnb',
    timezone: '+09:00'
});

// ✅ 현재 운영 중인 방 목록
const roomList = [
    { id: 1, name: 'C106' },
    { id: 2, name: 'C107' },
    { id: 3, name: 'C201' },
    { id: 4, name: 'C302' },
    { id: 5, name: 'C305' },
    { id: 6, name: 'C402' },
    { id: 8, name: 'N103' },
    { id: 9, name: 'N202' },
    { id: 10, name: 'R102' },
    { id: 11, name: 'N303' },
    { id: 12, name: 'N306' },
    { id: 13, name: 'N307' },
    { id: 14, name: 'N203' },
    { id: 15, name: 'N207' },
    { id: 16, name: 'N301' }
];

// ✅ Booking.com 숙소 리스트 (iCal URL만 사용)
const bookingListings = [
    // 예시:
    { id: 1, name: 'C106', bookingIcalUrl: "https://ical.booking.com/v1/export?t=51cb0da8-08b0-48d2-9c4f-3fca0c82d68a" },
    { id: 2, name: 'C107', bookingIcalUrl: "https://ical.booking.com/v1/export?t=3b79344b-f655-431e-a242-e341d6687bff" },
    { id: 3, name: 'C201', bookingIcalUrl: "https://ical.booking.com/v1/export?t=7ebb76a4-e64e-4aa8-b10f-f44563ddad77" },
    { id: 4, name: 'C302', bookingIcalUrl: "https://ical.booking.com/v1/export?t=2c7fbc09-1679-4c98-841d-b36c8c812397" },
    { id: 5, name: 'C305', bookingIcalUrl: "https://ical.booking.com/v1/export?t=78750e6c-6e83-4492-bc68-5d6ee839d94b" },
    { id: 6, name: 'C402', bookingIcalUrl: "https://ical.booking.com/v1/export?t=a439a607-0b82-49f5-81ba-1300804f411a" },
    { id: 8, name: 'N103', bookingIcalUrl: "https://ical.booking.com/v1/export?t=e2dc5702-7e08-4803-975b-055a9b4c1aa7" },
    { id: 9, name: 'N202', bookingIcalUrl: "https://ical.booking.com/v1/export?t=76fa03f1-22fa-4947-9b10-8b4636a82858" },
    { id: 10, name: 'R102', bookingIcalUrl: "https://ical.booking.com/v1/export?t=e544dbe8-c51f-4b7b-9738-5a7cb76a014e" },
    { id: 11, name: 'N303', bookingIcalUrl: "https://ical.booking.com/v1/export?t=84c3f453-f96a-45b1-94f0-673f56424970" },
    { id: 12, name: 'N306', bookingIcalUrl: "https://ical.booking.com/v1/export?t=c669d6fe-66ae-4dbd-8e8a-5238c67dcaaf" },
    { id: 13, name: 'N307', bookingIcalUrl: "https://ical.booking.com/v1/export?t=cb9785c5-513e-4588-8d9b-dc51eddca58e" },
    { id: 14, name: 'N203', bookingIcalUrl: "https://ical.booking.com/v1/export?t=d140a2b7-b3f5-4148-b2d6-09b727dc9585" },
    { id: 15, name: 'N207', bookingIcalUrl: "https://ical.booking.com/v1/export?t=6757631a-ce0c-4458-80f8-e286ecee7ca6" },
    { id: 16, name: 'N301', bookingIcalUrl: "https://ical.booking.com/v1/export?t=be72ae8b-c9f8-4eef-8904-e9287d99e8ca" }
    // 실제 booking.com iCal URL을 여기에 추가하세요
];

// ✅ Booking.com iCal로 예약 가져오기
const fetchBookingsFromBookingIcal = async (listing) => {
    try {
        if (!listing.bookingIcalUrl) {
            console.log(`⚠️ ${listing.name} iCal URL이 설정되지 않음`);
            return [];
        }
        
        console.log(`📡 ${listing.name} iCal에서 예약 가져오는 중...`);
        const events = await ical.async.fromURL(listing.bookingIcalUrl);
        const reservations = Object.values(events).filter(event => event.start && event.end);
        
        console.log(`✅ ${listing.name} iCal에서 ${reservations.length}개 예약 조회됨`);
        return reservations;
    } catch (error) {
        console.error(`❌ ${listing.name} iCal 예약 조회 실패:`, error.message);
        return [];
    }
};

// ✅ Booking.com에서 예약 가져오기 (iCal만 사용)
const fetchAndStoreBookingBookings = async () => {
    try {
        console.log("🔄 Booking.com → 우리 시스템 동기화 시작...");

        for (const listing of bookingListings) {
            console.log(`📡 ${listing.name} Booking.com 예약 가져오는 중...`);

            // 💥 기존 예약 삭제
            await db.query(
                "DELETE FROM CustomerInfo WHERE reserved_room_number = ? AND name = 'batch' AND REG_ID = 'booking'",
                [listing.name]
            );
            console.log(`🗑️ 기존 Booking.com 예약 삭제됨: ${listing.name}`);

            // iCal로 예약 가져오기
            const reservations = await fetchBookingsFromBookingIcal(listing);

            // 예약 데이터 저장
            for (const reservation of reservations) {
                let checkIn, checkOut, guestName = 'batch', guestEmail = '', guestPhone = '';

                if (reservation.start && reservation.end) {
                    // ✅ 한국 시간대 고려한 날짜 변환
                    const startDate = new Date(reservation.start);
                    const endDate = new Date(reservation.end);
                    
                    // 한국 시간대로 변환 (UTC+9)
                    const koreaStart = new Date(startDate.getTime() + (9 * 60 * 60 * 1000));
                    const koreaEnd = new Date(endDate.getTime() + (9 * 60 * 60 * 1000));
                    
                    checkIn = koreaStart.toISOString().split("T")[0].replace(/-/g, '');
                    checkOut = koreaEnd.toISOString().split("T")[0].replace(/-/g, '');
                } else {
                    continue;
                }

                await db.query(
                    `INSERT INTO CustomerInfo (
                        name, email, phone_number, passport_number,
                        check_in, check_out,
                        check_in_message_status, check_out_message_status,
                        check_in_mail_status, check_out_mail_status, reservation_mail_status,
                        reserved_room_number, review_id, totalprice,
                        MDFY_DTM, MDFY_ID, REG_DTM, REG_ID
                    ) VALUES (
                        ?, ?, ?, '', ?, ?,
                        'N', 'N', 'N', 'N', 'N',
                        ?, 0, 0, NOW(), 'booking', NOW(), 'booking'
                    )`,
                    [guestName, guestEmail, guestPhone, checkIn, checkOut, listing.name]
                );

                console.log(`✅ Booking.com 예약 삽입됨: ${listing.name} | ${checkIn} ~ ${checkOut} | ${guestName}`);
            }
        }

        console.log("🎉 Booking.com → 우리 시스템 동기화 완료!");
    } catch (error) {
        console.error("❌ Booking.com 동기화 오류 발생:", error);
    }
};

// ✅ 우리 시스템에서 Booking.com으로 예약 전송 (iCal만 사용)
const sendOurBookingsToBooking = async () => {
    try {
        console.log("🔄 우리 시스템 → Booking.com 동기화 시작...");
        console.log("📅 iCal 파일이 자동으로 업데이트되어 Booking.com에서 가져올 수 있습니다.");
        
        // iCal 파일들을 업데이트하여 Booking.com에서 가져올 수 있도록 함
        await generateAndSaveIcal(); // 전체 예약 iCal 업데이트
        
        // 각 객실별 iCal도 업데이트
        for (const room of roomList) {
            await generateAndSaveIcal(room.name);
        }

        console.log("🎉 우리 시스템 → Booking.com 동기화 완료!");
        console.log("📋 Booking.com에서 다음 URL들을 구독하여 예약을 가져올 수 있습니다:");
        const urls = generateIcalUrls();
        Object.entries(urls.rooms).forEach(([roomName, url]) => {
            console.log(`   ${roomName}: ${url}`);
        });
    } catch (error) {
        console.error("❌ 우리 시스템 → Booking.com 동기화 오류:", error);
    }
};

// ✅ iCal 내보내기 함수
const generateIcalContent = (reservations, roomNumber = null) => {
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Noryangjin Studio//Reservation System//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Noryangjin Studio Reservations
X-WR-CALDESC:Reservation Calendar for Noryangjin Studio
X-WR-TIMEZONE:Asia/Seoul
`;

    reservations.forEach(reservation => {
        const startDate = formatDateForIcal(reservation.check_in);
        const endDate = formatDateForIcal(reservation.check_out);
        const summary = `${reservation.reserved_room_number} - ${reservation.name}`;
        const description = `Guest: ${reservation.name}\\nEmail: ${reservation.email || ''}\\nPhone: ${reservation.phone_number || ''}\\nPrice: ₩${reservation.totalprice?.toLocaleString() || '0'}\\nSource: ${reservation.REG_ID}`;
        const uid = `reservation-${reservation.customer_id}@noryangjin.co.kr`;
        const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const created = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        icalContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;TZID=Asia/Seoul:${startDate.substring(0,4)}${startDate.substring(4,6)}${startDate.substring(6,8)}T000000
DTEND;TZID=Asia/Seoul:${endDate.substring(0,4)}${endDate.substring(4,6)}${endDate.substring(6,8)}T000000
SUMMARY:${summary}
DESCRIPTION:${description}
STATUS:CONFIRMED
TRANSP:OPAQUE
CREATED:${created}
LAST-MODIFIED:${dtstamp}
END:VEVENT
`;
    });

    icalContent += 'END:VCALENDAR';
    return icalContent;
};

// ✅ 날짜 형식 변환 함수 (iCal용)
const formatDateForIcal = (dateString) => {
    if (dateString.length === 8) {
        return `${dateString.substring(0,4)}${dateString.substring(4,6)}${dateString.substring(6,8)}`;
    }
    return dateString;
};

// ✅ iCal 파일 생성 및 저장
const generateAndSaveIcal = async (roomNumber = null) => {
    try {
        console.log(`📅 iCal 파일 생성 중... ${roomNumber ? `(객실: ${roomNumber})` : '(전체)'}`);
        
        let query = `
            SELECT 
                customer_id, name, email, phone_number,
                check_in, check_out, reserved_room_number, totalprice,
                REG_ID, MDFY_DTM
            FROM CustomerInfo 
            WHERE check_in >= DATE_FORMAT(NOW(), '%Y%m%d')
            ORDER BY check_in, reserved_room_number
        `;
        
        let params = [];
        if (roomNumber) {
            query = query.replace('ORDER BY', 'AND reserved_room_number = ? ORDER BY');
            params = [roomNumber];
        }

        const [reservations] = await db.query(query, params);
        
        if (reservations.length === 0) {
            console.log(`⚠️ 내보낼 예약이 없습니다. ${roomNumber ? `(객실: ${roomNumber})` : ''}`);
            return null;
        }

        const icalContent = generateIcalContent(reservations, roomNumber);
        const filename = `noryangjin-reservations${roomNumber ? `-${roomNumber}` : ''}.ics`;
        
        // 파일 시스템에 저장 (public 폴더에)
        const fs = require('fs');
        const path = require('path');
        const publicPath = path.join(__dirname, '../../public/ical');
        
        // ical 폴더가 없으면 생성
        if (!fs.existsSync(publicPath)) {
            fs.mkdirSync(publicPath, { recursive: true });
        }
        
        const filePath = path.join(publicPath, filename);
        fs.writeFileSync(filePath, icalContent, 'utf8');
        
        // 환경에 따른 URL 설정
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://airbnbnoryangjin.co.kr' 
            : 'http://localhost:30021';
        
        const fullUrl = `${baseUrl}/ical/${filename}`;
        
        console.log(`✅ iCal 파일 생성 완료: ${filename} (${reservations.length}개 예약)`);
        console.log(`📅 iCal 구독 URL: ${fullUrl}`);
        
        return {
            filename,
            filePath,
            url: fullUrl,
            reservationCount: reservations.length
        };
        
    } catch (error) {
        console.error('❌ iCal 파일 생성 오류:', error);
        throw error;
    }
};

// ✅ 예약 후 자동 iCal 내보내기
const autoExportIcalAfterReservation = async (reservationData) => {
    try {
        console.log('🔄 예약 후 자동 iCal 내보내기 시작...');
        
        // 1. 해당 객실의 iCal 파일 생성
        if (reservationData.title) {
            await generateAndSaveIcal(reservationData.title);
        }
        
        // 2. 전체 예약 iCal 파일도 업데이트
        await generateAndSaveIcal();
        
        console.log('✅ 예약 후 자동 iCal 내보내기 완료!');
        
    } catch (error) {
        console.error('❌ 예약 후 자동 iCal 내보내기 실패:', error);
        // iCal 생성 실패해도 예약은 성공으로 처리
    }
};

// ✅ iCal URL 생성 함수
const generateIcalUrls = () => {
    const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://airbnbnoryangjin.co.kr' 
        : 'http://localhost:30021';
    
    const urls = {
        all: `${baseUrl}/ical/noryangjin-reservations.ics`,
        rooms: {}
    };
    
    roomList.forEach(room => {
        urls.rooms[room.name] = `${baseUrl}/ical/noryangjin-reservations-${room.name}.ics`;
    });
    
    return urls;
};

// ✅ iCal URL 목록 출력 함수
const printIcalUrls = () => {
    const urls = generateIcalUrls();
    
    console.log('\n📅 ===== iCal 구독 URL 목록 =====');
    console.log(`\n🌐 전체 예약 캘린더:`);
    console.log(`   ${urls.all}`);
    
    console.log(`\n🏠 객실별 예약 캘린더:`);
    Object.entries(urls.rooms).forEach(([roomName, url]) => {
        console.log(`   ${roomName}: ${url}`);
    });
    
    console.log('\n📋 Booking.com에 제공할 URL 목록:');
    console.log('   (각 객실별로 Booking.com에 등록할 iCal URL)');
    Object.entries(urls.rooms).forEach(([roomName, url]) => {
        console.log(`   ${roomName} → ${url}`);
    });
    
    console.log('\n=====================================\n');
    
    return urls;
};

// ✅ 양방향 동기화 통합 함수
const syncWithBookingCom = async () => {
    console.log("🚀 Booking.com 양방향 동기화 시작...");
    try {
        await fetchAndStoreBookingBookings();
        await sendOurBookingsToBooking();
        console.log("🎉 Booking.com 양방향 동기화 완료!");
    } catch (error) {
        console.error("❌ 양방향 동기화 오류:", error);
    }
};

// 🕐 매일 새벽 1시에 자동 실행 설정 (UTC 기준 16:00)
cron.schedule("0 16 * * *", () => {
    console.log("⏰ Booking.com 양방향 동기화 배치 실행 중...");
    syncWithBookingCom();
});

// 🔃 개발 시 수동 실행도 가능
syncWithBookingCom();

// ✅ iCal URL 목록 출력
printIcalUrls();

// ✅ Booking.com 수동 전송 함수
async function manualBookingSync() {
    try {
        console.log('🔄 Booking.com 수동 전송 시작...');
        
        const files = [];
        
        // 전체 예약 내보내기
        const allResult = await generateAndSaveIcal();
        if (allResult) {
            files.push(allResult.filename);
            console.log(`✅ 전체 예약 iCal 생성: ${allResult.filename}`);
        }
        
        // 각 객실별 예약 내보내기
        for (const room of roomList) {
            const roomResult = await generateAndSaveIcal(room.name);
            if (roomResult) {
                files.push(roomResult.filename);
                console.log(`✅ ${room.name} 객실 iCal 생성: ${roomResult.filename}`);
            }
        }
        
        console.log(`✅ Booking.com 수동 전송 완료! 총 ${files.length}개 파일 생성`);
        
        return {
            success: true,
            files: files,
            message: `총 ${files.length}개 iCal 파일이 생성되었습니다.`
        };
        
    } catch (error) {
        console.error('❌ Booking.com 수동 전송 실패:', error);
        throw error;
    }
}

module.exports = {
    fetchAndStoreBookingBookings,
    sendOurBookingsToBooking,
    syncWithBookingCom,
    generateAndSaveIcal,
    autoExportIcalAfterReservation,
    generateIcalUrls,
    printIcalUrls,
    manualBookingSync,
    roomList
};
