const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const cron = require("node-cron");
const ical = require("node-ical");
const mysql = require("mysql2/promise");
const fs = require('fs').promises;

// ✅ MySQL 연결 설정
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    timezone: process.env.DB_TIMEZONE
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

// 🚀 캐시 및 성능 최적화 설정
const CACHE_DIR = path.join(__dirname, '../../cache');
const CACHE_DURATION = 10 * 60 * 1000; // 10분 캐시 (더 길게)
const MAX_CONCURRENT_REQUESTS = 2; // 동시 요청 제한 (보수적으로)
const REQUEST_DELAY = 1000; // 요청 간 1초 지연

// 캐시 디렉토리 생성
const ensureCacheDir = async () => {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
};

// ✅ Booking.com 숙소 리스트 (iCal URL만 사용)
const bookingListings = [
    // 예시:
    { id: 1, name: 'C106', bookingIcalUrl: "https://ical.booking.com/v1/export?t=5120ca8a-2302-456a-ab0d-41e3377e2bb2" },
    { id: 2, name: 'C107', bookingIcalUrl: "https://ical.booking.com/v1/export?t=229cde29-1ca4-4942-8f07-948b89a167a0" },
    { id: 3, name: 'C201', bookingIcalUrl: "https://ical.booking.com/v1/export?t=36a02f7d-32fe-4c79-bc31-6a6759a2cf64" },
    { id: 4, name: 'C302', bookingIcalUrl: "https://ical.booking.com/v1/export?t=c54da310-4974-4357-b3db-1ce8d8606462" },
    { id: 5, name: 'C305', bookingIcalUrl: "https://ical.booking.com/v1/export?t=4439e712-56ea-46d1-ae4a-8f747604ad7d" },
    { id: 6, name: 'C402', bookingIcalUrl: "https://ical.booking.com/v1/export?t=01675ad5-c9ae-46e0-be6d-2d55ee8d210f" },
    { id: 8, name: 'N103', bookingIcalUrl: "https://ical.booking.com/v1/export?t=c10c31a2-ca3b-4896-a838-4c751d990e01" },
    { id: 9, name: 'N202', bookingIcalUrl: "https://ical.booking.com/v1/export?t=5c3ad545-f5cc-4ce8-8ac6-1e110f4f1b0c" },
    { id: 10, name: 'R102', bookingIcalUrl: "https://ical.booking.com/v1/export?t=16714330-23ee-4cb9-8010-c98da5456252" },
    { id: 11, name: 'N303', bookingIcalUrl: "https://ical.booking.com/v1/export?t=faf99c38-84e7-4590-8930-f86177fa0222" },
    { id: 12, name: 'N306', bookingIcalUrl: "https://ical.booking.com/v1/export?t=bb6a7524-17a2-4f62-9ca9-e122721c8186" },
    { id: 13, name: 'N307', bookingIcalUrl: "https://ical.booking.com/v1/export?t=dacc2722-ed53-4675-b9cc-5b62ff2e86db" },
    { id: 14, name: 'N203', bookingIcalUrl: "https://ical.booking.com/v1/export?t=b4709d87-2fec-4d51-b96d-2d21822bb970" },
    { id: 15, name: 'N207', bookingIcalUrl: "https://ical.booking.com/v1/export?t=c2836cbb-b99e-48ec-a669-7e80b073278a" },
    { id: 16, name: 'N301', bookingIcalUrl: "https://ical.booking.com/v1/export?t=e170891a-ed13-483f-b6ae-cca83405328e" }
    // 실제 booking.com iCal URL을 여기에 추가하세요
];

// 🚀 캐시된 데이터 확인
const getCachedData = async (roomName) => {
    try {
        const cacheFile = path.join(CACHE_DIR, `${roomName}_cache.json`);
        const stats = await fs.stat(cacheFile);
        const now = Date.now();
        
        if (now - stats.mtime.getTime() < CACHE_DURATION) {
            const cached = await fs.readFile(cacheFile, 'utf8');
            return JSON.parse(cached);
        }
        return null;
    } catch {
        return null;
    }
};

// 🚀 데이터 캐시 저장
const setCachedData = async (roomName, data) => {
    try {
        await ensureCacheDir();
        const cacheFile = path.join(CACHE_DIR, `${roomName}_cache.json`);
        await fs.writeFile(cacheFile, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.warn(`⚠️ 캐시 저장 실패 (${roomName}):`, error.message);
    }
};

// 🚀 동시 요청 제한을 위한 세마포어
class Semaphore {
    constructor(max) {
        this.max = max;
        this.current = 0;
        this.queue = [];
    }

    async acquire() {
        return new Promise((resolve) => {
            if (this.current < this.max) {
                this.current++;
                resolve();
            } else {
                this.queue.push(resolve);
            }
        });
    }

    release() {
        this.current--;
        if (this.queue.length > 0) {
            const resolve = this.queue.shift();
            this.current++;
            resolve();
        }
    }
}

const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);

// ✅ Booking.com iCal로 예약 가져오기 (캐시 + 최적화)
const fetchBookingsFromBookingIcal = async (listing, useCache = true) => {
    try {
        if (!listing.bookingIcalUrl) {
            console.log(`⚠️ ${listing.name} iCal URL이 설정되지 않음`);
            return [];
        }
        
        // 🚀 캐시 확인
        if (useCache) {
            const cached = await getCachedData(listing.name);
            if (cached) {
                console.log(`⚡ ${listing.name} 캐시에서 데이터 로드 (${cached.data.length}개 예약)`);
                return cached.data;
            }
        }
        
        // 🚀 동시 요청 제한
        await semaphore.acquire();
        
        try {
        console.log(`📡 ${listing.name} iCal에서 예약 가져오는 중...`);
        const events = await ical.async.fromURL(listing.bookingIcalUrl);
        const reservations = Object.values(events).filter(event => event.start && event.end);
            
            // 🚀 캐시 저장
            await setCachedData(listing.name, reservations);
        
        console.log(`✅ ${listing.name} iCal에서 ${reservations.length}개 예약 조회됨`);
        return reservations;
        } finally {
            semaphore.release();
        }
    } catch (error) {
        console.error(`❌ ${listing.name} iCal 예약 조회 실패:`, error.message);
        
        // 🚀 실패 시 캐시된 데이터 사용
        const cached = await getCachedData(listing.name);
        if (cached) {
            console.log(`🔄 ${listing.name} 캐시된 데이터 사용 (${cached.data.length}개 예약)`);
            return cached.data;
        }
        
        return [];
    }
};

// 🚀 지연 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🗄️ 백업 테이블 생성 (취소된 예약 보관용)
const createBackupTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS CustomerInfo_Backup (
                customer_id INT PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100),
                phone_number VARCHAR(20),
                passport_number VARCHAR(50),
                check_in VARCHAR(8),
                check_out VARCHAR(8),
                check_in_message_status CHAR(1),
                check_out_message_status CHAR(1),
                check_in_mail_status CHAR(1),
                check_out_mail_status CHAR(1),
                reservation_mail_status CHAR(1),
                reserved_room_number VARCHAR(10),
                review_id INT,
                totalprice INT,
                MDFY_DTM DATETIME,
                MDFY_ID VARCHAR(50),
                REG_DTM DATETIME,
                REG_ID VARCHAR(50),
                cancelled_at DATETIME,
                cancellation_reason VARCHAR(100)
            )
        `);
        console.log("✅ 백업 테이블 확인/생성 완료");
    } catch (error) {
        console.warn("⚠️ 백업 테이블 생성 실패:", error.message);
    }
};

// 🚨 오버부킹 방지 시스템
// 🔍 단일 예약의 오버부킹 체크 (기존 함수 유지)
const checkOverbooking = async (roomName, checkIn, checkOut) => {
    try {
        // 해당 객실의 모든 예약 조회 (우리 시스템 + Booking.com)
        const [allReservations] = await db.query(`
            SELECT customer_id, name, check_in, check_out, REG_ID, MDFY_DTM
            FROM CustomerInfo 
            WHERE reserved_room_number = ? 
            AND (
                (check_in <= ? AND check_out > ?) OR  -- 기존 예약이 새 예약과 겹침
                (check_in < ? AND check_out >= ?) OR  -- 새 예약이 기존 예약과 겹침
                (check_in >= ? AND check_out <= ?)    -- 새 예약이 기존 예약을 포함
            )
            ORDER BY check_in
        `, [roomName, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut]);

        if (allReservations.length > 0) {
            console.log(`🚨 오버부킹 감지: ${roomName} | ${checkIn} ~ ${checkOut}`);
            allReservations.forEach(reservation => {
                const source = reservation.REG_ID === 'booking' ? 'Booking.com' : '우리 시스템';
                console.log(`   ⚠️ 겹치는 예약: ${reservation.check_in} ~ ${reservation.check_out} (${source})`);
            });
            return { isOverbooked: true, conflictingReservations: allReservations };
        }

        return { isOverbooked: false, conflictingReservations: [] };
    } catch (error) {
        console.error(`❌ 오버부킹 체크 실패 (${roomName}):`, error);
        return { isOverbooked: false, conflictingReservations: [] };
    }
};

// 🔍 전체 시스템 오버부킹 체크 및 관리
const checkAllOverbookings = async () => {
    try {
        console.log('🔍 전체 오버부킹 체크를 시작합니다...');
        
        const query = `
            SELECT 
                c1.customer_id as booking1_id,
                c1.name as booking1_name,
                c1.reserved_room_number as room,
                c1.check_in as booking1_checkin,
                c1.check_out as booking1_checkout,
                c1.MDFY_ID as booking1_type,
                DATE_FORMAT(c1.REG_DTM, '%Y-%m-%d %H:%i:%s') as booking1_created,
                c2.customer_id as booking2_id,
                c2.name as booking2_name,
                c2.check_in as booking2_checkin,
                c2.check_out as booking2_checkout,
                c2.MDFY_ID as booking2_type,
                DATE_FORMAT(c2.REG_DTM, '%Y-%m-%d %H:%i:%s') as booking2_created,
                CASE 
                    WHEN c1.check_in <= c2.check_in AND c1.check_out > c2.check_in THEN 'OVERLAP_START'
                    WHEN c1.check_in < c2.check_out AND c1.check_out >= c2.check_out THEN 'OVERLAP_END'
                    WHEN c1.check_in >= c2.check_in AND c1.check_out <= c2.check_out THEN 'CONTAINED'
                    WHEN c1.check_in <= c2.check_in AND c1.check_out >= c2.check_out THEN 'CONTAINS'
                    ELSE 'OTHER'
                END as conflict_type,
                GREATEST(c1.check_in, c2.check_in) as conflict_start,
                LEAST(c1.check_out, c2.check_out) as conflict_end,
                DATEDIFF(STR_TO_DATE(LEAST(c1.check_out, c2.check_out), '%Y%m%d'), 
                         STR_TO_DATE(GREATEST(c1.check_in, c2.check_in), '%Y%m%d')) as overlap_days
            FROM CustomerInfo c1
            JOIN CustomerInfo c2 ON 
                c1.reserved_room_number = c2.reserved_room_number 
                AND c1.customer_id < c2.customer_id
            WHERE 
                (
                    (c1.check_in <= c2.check_in AND c1.check_out > c2.check_in)
                    OR
                    (c1.check_in < c2.check_out AND c1.check_out >= c2.check_out)
                    OR
                    (c1.check_in >= c2.check_in AND c1.check_out <= c2.check_out)
                    OR
                    (c1.check_in <= c2.check_in AND c1.check_out >= c2.check_out)
                )
            ORDER BY c1.reserved_room_number, c1.check_in, c2.check_in
        `;
        
        const [conflicts] = await db.query(query);
        
        if (conflicts.length === 0) {
            console.log('✅ 오버부킹이 발견되지 않았습니다!');
            return { hasConflicts: false, conflicts: [], stats: null };
        }

        // 통계 생성
        const stats = generateOverbookingStats(conflicts);
        
        console.log(`❌ ${conflicts.length}개의 오버부킹이 발견되었습니다!`);
        printOverbookingTable(conflicts);
        printOverbookingStats(stats);
        
        return { hasConflicts: true, conflicts, stats };
        
    } catch (error) {
        console.error('❌ 전체 오버부킹 체크 중 오류:', error);
        throw error;
    }
};

// 🔍 특정 방의 오버부킹 체크
const checkRoomOverbookings = async (roomNumber) => {
    try {
        const result = await checkAllOverbookings();
        if (!result.hasConflicts) {
            return { hasConflicts: false, conflicts: [] };
        }
        
        const roomConflicts = result.conflicts.filter(conflict => conflict.room === roomNumber);
        
        if (roomConflicts.length === 0) {
            console.log(`✅ ${roomNumber}호실은 오버부킹이 없습니다.`);
            return { hasConflicts: false, conflicts: [] };
        }
        
        console.log(`❌ ${roomNumber}호실에서 ${roomConflicts.length}개의 오버부킹 발견:`);
        printOverbookingTable(roomConflicts);
        
        return { hasConflicts: true, conflicts: roomConflicts };
        
    } catch (error) {
        console.error(`❌ ${roomNumber} 오버부킹 체크 중 오류:`, error);
        throw error;
    }
};

// 📊 오버부킹 통계 생성
const generateOverbookingStats = (conflicts) => {
    // 방별 통계
    const roomStats = {};
    conflicts.forEach(conflict => {
        if (!roomStats[conflict.room]) {
            roomStats[conflict.room] = {
                count: 0,
                totalOverlapDays: 0,
                conflicts: []
            };
        }
        roomStats[conflict.room].count++;
        roomStats[conflict.room].totalOverlapDays += conflict.overlap_days;
        roomStats[conflict.room].conflicts.push(conflict);
    });

    // 타입별 통계
    const typeStats = {};
    conflicts.forEach(conflict => {
        const typeKey = `${conflict.booking1_type} vs ${conflict.booking2_type}`;
        if (!typeStats[typeKey]) {
            typeStats[typeKey] = 0;
        }
        typeStats[typeKey]++;
    });

    // 충돌 타입별 통계
    const conflictTypeStats = {};
    conflicts.forEach(conflict => {
        conflictTypeStats[conflict.conflict_type] = (conflictTypeStats[conflict.conflict_type] || 0) + 1;
    });

    return {
        totalConflicts: conflicts.length,
        roomStats,
        typeStats,
        conflictTypeStats
    };
};

// 📋 오버부킹을 테이블 형식으로 출력
const printOverbookingTable = (conflicts) => {
    console.log('\n📋 오버부킹 현황 테이블');
    console.log('='.repeat(140));
    console.log(sprintf('%-8s %-15s %-15s %-20s %-20s %-12s %-8s %-15s', 
        '방호실', '예약1 ID', '예약2 ID', '예약1 기간', '예약2 기간', '충돌타입', '겹침일수', '생성일시'));
    console.log('-'.repeat(140));

    conflicts.forEach(conflict => {
        const booking1Period = `${conflict.booking1_checkin}~${conflict.booking1_checkout}`;
        const booking2Period = `${conflict.booking2_checkin}~${conflict.booking2_checkout}`;
        
        console.log(sprintf('%-8s %-15s %-15s %-20s %-20s %-12s %-8s %-15s',
            conflict.room,
            `${conflict.booking1_id}(${conflict.booking1_type})`,
            `${conflict.booking2_id}(${conflict.booking2_type})`,
            booking1Period,
            booking2Period,
            conflict.conflict_type,
            `${conflict.overlap_days}일`,
            conflict.booking1_created.split(' ')[0]
        ));
    });

    console.log('='.repeat(140));
};

// 📊 오버부킹 통계 출력
const printOverbookingStats = (stats) => {
    console.log('\n📊 오버부킹 통계:');
    console.log(`총 충돌 수: ${stats.totalConflicts}개\n`);
    
    console.log('방별 현황:');
    Object.entries(stats.roomStats).forEach(([room, roomStat]) => {
        console.log(`  ${room}: ${roomStat.count}개 충돌 (총 ${roomStat.totalOverlapDays}일 겹침)`);
    });
    
    console.log('\n예약 타입별 충돌:');
    Object.entries(stats.typeStats).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}개`);
    });
    
    console.log('\n충돌 패턴별:');
    Object.entries(stats.conflictTypeStats).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}개`);
    });
    console.log('');
};

// sprintf 함수 (간단한 구현)
const sprintf = (format, ...args) => {
    let i = 0;
    return format.replace(/%-?(\d+)s/g, (match, width) => {
        const arg = String(args[i++] || '');
        const isLeftAlign = match.startsWith('%-');
        const w = parseInt(width);
        
        if (isLeftAlign) {
            return arg.padEnd(w);
        } else {
            return arg.padStart(w);
        }
    });
};

// 🔍 Express 컨트롤러 함수들
const checkAllOverbookingsController = async (req, res) => {
    try {
        console.log(`🔍 전체 시스템 오버부킹 체크 요청`);
        const result = await checkAllOverbookings();
        
        res.json({
            success: true,
            hasConflicts: result.hasConflicts,
            totalConflicts: result.conflicts.length,
            conflicts: result.conflicts,
            stats: result.stats,
            message: result.hasConflicts 
                ? `${result.conflicts.length}개의 오버부킹이 발견되었습니다.`
                : "오버부킹이 발견되지 않았습니다."
        });
        
    } catch (error) {
        console.error("❌ 전체 오버부킹 체크 실패:", error);
        res.status(500).json({
            success: false,
            error: "전체 오버부킹 체크 중 오류가 발생했습니다.",
            message: error.message
        });
    }
};

const checkRoomOverbookingsController = async (req, res) => {
    try {
        const { roomNumber } = req.params;
        
        if (!roomNumber) {
            return res.status(400).json({
                success: false,
                error: "객실번호가 필요합니다."
            });
        }
        
        console.log(`🔍 ${roomNumber}호실 오버부킹 체크 요청`);
        const result = await checkRoomOverbookings(roomNumber);
        
        res.json({
            success: true,
            room: roomNumber,
            hasConflicts: result.hasConflicts,
            totalConflicts: result.conflicts.length,
            conflicts: result.conflicts,
            message: result.hasConflicts 
                ? `${roomNumber}호실에서 ${result.conflicts.length}개의 오버부킹이 발견되었습니다.`
                : `${roomNumber}호실은 오버부킹이 없습니다.`
        });
        
    } catch (error) {
        console.error(`❌ ${req.params.roomNumber} 오버부킹 체크 실패:`, error);
        res.status(500).json({
            success: false,
            error: "방별 오버부킹 체크 중 오류가 발생했습니다.",
            message: error.message
        });
    }
};

// 🔄 실시간 예약 충돌 해결 시스템
const resolveBookingConflicts = async (roomName, newReservations) => {
    try {
        console.log(`🔄 ${roomName} 예약 충돌 해결 중...`);
        
        const conflicts = [];
        
        for (const reservation of newReservations) {
            if (reservation.start && reservation.end) {
                const startDate = new Date(reservation.start);
                const endDate = new Date(reservation.end);
                const koreaStart = new Date(startDate.getTime() + (9 * 60 * 60 * 1000));
                const koreaEnd = new Date(endDate.getTime() + (9 * 60 * 60 * 1000));
                const checkIn = koreaStart.toISOString().split("T")[0].replace(/-/g, '');
                const checkOut = koreaEnd.toISOString().split("T")[0].replace(/-/g, '');
                
                const overbookingCheck = await checkOverbooking(roomName, checkIn, checkOut);
                
                if (overbookingCheck.isOverbooked) {
                    conflicts.push({
                        reservation,
                        checkIn,
                        checkOut,
                        conflictingReservations: overbookingCheck.conflictingReservations
                    });
                }
            }
        }
        
        if (conflicts.length > 0) {
            console.log(`⚠️ ${roomName} 예약 충돌 ${conflicts.length}건 발견`);
            
            // 충돌 해결 전략 적용
            for (const conflict of conflicts) {
                await resolveSingleConflict(roomName, conflict);
            }
        }
        
        return conflicts.length;
    } catch (error) {
        console.error(`❌ ${roomName} 예약 충돌 해결 실패:`, error);
        return 0;
    }
};

// 🔧 단일 예약 충돌 해결
const resolveSingleConflict = async (roomName, conflict) => {
    try {
        const { checkIn, checkOut, conflictingReservations } = conflict;
        
        // 충돌 해결 전략: Booking.com 예약 우선 (더 최신 정보)
        const bookingConflicts = conflictingReservations.filter(r => r.REG_ID === 'booking');
        const ourConflicts = conflictingReservations.filter(r => r.REG_ID !== 'booking');
        
        if (bookingConflicts.length > 0) {
            console.log(`🔄 ${roomName} Booking.com 예약 우선 적용: ${checkIn} ~ ${checkOut}`);
            
            // 우리 시스템 예약을 백업으로 이동
            for (const ourConflict of ourConflicts) {
                try {
                    await db.query(`
                        INSERT INTO CustomerInfo_Backup 
                        (customer_id, name, email, phone_number, passport_number, check_in, check_out, 
                         reserved_room_number, totalprice, MDFY_DTM, MDFY_ID, 
                         REG_DTM, REG_ID, cancelled_at, cancellation_reason)
                        SELECT customer_id, name, email, phone_number, passport_number, check_in, check_out, 
                               reserved_room_number, totalprice, MDFY_DTM, MDFY_ID, 
                               REG_DTM, REG_ID, NOW() as cancelled_at, 'overbooking_resolved' as cancellation_reason
                        FROM CustomerInfo 
                        WHERE customer_id = ?
                    `, [ourConflict.customer_id]);
                    
                    await db.query(
                        `DELETE FROM CustomerInfo WHERE customer_id = ?`,
                        [ourConflict.customer_id]
                    );
                    
                    console.log(`✅ ${roomName} 충돌 예약 백업: ${ourConflict.check_in} ~ ${ourConflict.check_out} (ID: ${ourConflict.customer_id})`);
                } catch (error) {
                    console.error(`❌ ${roomName} 충돌 예약 백업 실패:`, error);
                }
            }
        } else {
            console.log(`⚠️ ${roomName} 우리 시스템 예약만 존재: ${checkIn} ~ ${checkOut} (Booking.com 예약 추가 예정)`);
        }
        
    } catch (error) {
        console.error(`❌ ${roomName} 단일 충돌 해결 실패:`, error);
    }
};

// 🚀 중복 데이터 확인 함수 (삭제하지 않음)
const checkDuplicateBookings = async () => {
    try {
        console.log("🔍 중복 Booking.com 예약 데이터 확인 중...");
        
        // 중복 데이터 찾기 (같은 객실, 같은 체크인/아웃 날짜)
        const [duplicates] = await db.query(`
            SELECT 
                reserved_room_number, check_in, check_out, 
                COUNT(*) as count,
                GROUP_CONCAT(customer_id) as customer_ids
            FROM CustomerInfo 
            WHERE REG_ID = 'booking' AND name = 'batch'
            GROUP BY reserved_room_number, check_in, check_out
            HAVING COUNT(*) > 1
        `);

        if (duplicates.length > 0) {
            console.log(`⚠️ 중복 데이터 ${duplicates.length}건 발견 (삭제하지 않음)`);
            
            for (const duplicate of duplicates) {
                const customerIds = duplicate.customer_ids.split(',');
                console.log(`📋 ${duplicate.reserved_room_number} | ${duplicate.check_in} ~ ${duplicate.check_out} | 중복 ID: ${customerIds.join(', ')}`);
            }
        } else {
            console.log("✅ 중복 데이터 없음");
        }
        
        return duplicates.length;
    } catch (error) {
        console.error("❌ 중복 데이터 확인 실패:", error);
        return 0;
    }
};

// 🔄 Booking.com 예약 변경/취소 감지 및 처리
const handleBookingChanges = async (roomName, newReservations) => {
    try {
        console.log(`🔄 ${roomName} 예약 변경사항 확인 중...`);
        
        // 현재 DB에 있는 Booking.com 예약 조회
        const [existingReservations] = await db.query(`
            SELECT customer_id, check_in, check_out, MDFY_DTM
            FROM CustomerInfo 
            WHERE reserved_room_number = ? AND REG_ID = 'booking' AND name = 'batch'
            ORDER BY check_in
        `, [roomName]);
        
        // 새로운 예약 데이터를 키-값 맵으로 변환
        const newReservationMap = new Map();
        newReservations.forEach(reservation => {
            if (reservation.start && reservation.end) {
                const startDate = new Date(reservation.start);
                const endDate = new Date(reservation.end);
                const koreaStart = new Date(startDate.getTime() + (9 * 60 * 60 * 1000));
                const koreaEnd = new Date(endDate.getTime() + (9 * 60 * 60 * 1000));
                const checkIn = koreaStart.toISOString().split("T")[0].replace(/-/g, '');
                const checkOut = koreaEnd.toISOString().split("T")[0].replace(/-/g, '');
                
                const key = `${checkIn}_${checkOut}`;
                newReservationMap.set(key, { checkIn, checkOut, reservation });
            }
        });
        
        // 기존 예약과 비교하여 변경사항 확인
        const changes = {
            added: [],      // 새로 추가된 예약
            removed: [],    // 취소된 예약
            unchanged: []   // 변경되지 않은 예약
        };
        
        // 기존 예약 확인
        for (const existing of existingReservations) {
            const key = `${existing.check_in}_${existing.check_out}`;
            
            if (newReservationMap.has(key)) {
                // 변경되지 않은 예약
                changes.unchanged.push(existing);
                newReservationMap.delete(key); // 처리된 예약 제거
            } else {
                // 취소된 예약 (Booking.com에서 제거됨)
                changes.removed.push(existing);
            }
        }
        
        // 남은 예약들은 새로 추가된 것들
        for (const [key, data] of newReservationMap) {
            changes.added.push(data);
        }
        
        // 변경사항 로깅
        if (changes.added.length > 0) {
            console.log(`➕ ${roomName} 새 예약 ${changes.added.length}건 추가됨`);
            changes.added.forEach(item => {
                console.log(`   📅 ${item.checkIn} ~ ${item.checkOut}`);
            });
        }
        
        if (changes.removed.length > 0) {
            console.log(`➖ ${roomName} 취소된 예약 ${changes.removed.length}건 발견`);
            changes.removed.forEach(item => {
                console.log(`   📅 ${item.check_in} ~ ${item.check_out} (ID: ${item.customer_id})`);
            });
        }
        
        if (changes.unchanged.length > 0) {
            console.log(`✅ ${roomName} 기존 예약 ${changes.unchanged.length}건 유지됨`);
        }
        
        return changes;
        
    } catch (error) {
        console.error(`❌ ${roomName} 예약 변경사항 확인 실패:`, error);
        return { added: [], removed: [], unchanged: [] };
    }
};

// ✅ Booking.com에서 예약 가져오기 (배치 처리 + 서버 부담 최소화)
const fetchAndStoreBookingBookings = async (useCache = true) => {
    try {
        console.log("🔄 Booking.com → 우리 시스템 동기화 시작...");

        
        const startTime = Date.now();
        const results = [];

        // 🚀 배치 처리: 2개씩 묶어서 순차 처리
        const batchSize = 2;
        for (let i = 0; i < bookingListings.length; i += batchSize) {
            const batch = bookingListings.slice(i, i + batchSize);
            console.log(`📦 배치 ${Math.floor(i/batchSize) + 1}/${Math.ceil(bookingListings.length/batchSize)} 처리 중...`);

            // 배치 내에서만 병렬 처리 (서버 부담 최소화)
            const batchPromises = batch.map(async (listing) => {
                try {
            console.log(`📡 ${listing.name} Booking.com 예약 가져오는 중...`);

                    // 🔍 기존 Booking.com 예약 확인 (삭제하지 않음)
                    const [existingCount] = await db.query(
                        "SELECT COUNT(*) as count FROM CustomerInfo WHERE reserved_room_number = ? AND name = 'batch' AND REG_ID = 'booking'",
                [listing.name]
            );
                    
                    if (existingCount[0].count > 0) {
                        console.log(`📋 기존 Booking.com 예약 ${existingCount[0].count}개 확인됨: ${listing.name} (삭제하지 않음)`);
                    }

                    // iCal로 예약 가져오기 (캐시 사용)
                    const reservations = await fetchBookingsFromBookingIcal(listing, useCache);
                    
                    // 🔍 중복 데이터 진단 로깅
                    console.log(`📊 ${listing.name} iCal에서 받은 예약 수: ${reservations.length}`);
                    
                    // 중복 예약 체크 (iCal 레벨)
                    const uniqueReservations = new Map();
                    const duplicateInIcal = [];
                    
                    reservations.forEach((reservation, index) => {
                if (reservation.start && reservation.end) {
                            const startDate = new Date(reservation.start);
                            const endDate = new Date(reservation.end);
                            const koreaStart = new Date(startDate.getTime() + (9 * 60 * 60 * 1000));
                            const koreaEnd = new Date(endDate.getTime() + (9 * 60 * 60 * 1000));
                            const checkIn = koreaStart.toISOString().split("T")[0].replace(/-/g, '');
                            const checkOut = koreaEnd.toISOString().split("T")[0].replace(/-/g, '');
                            
                            const key = `${checkIn}_${checkOut}`;
                            if (uniqueReservations.has(key)) {
                                duplicateInIcal.push({ index, key, checkIn, checkOut });
                                console.log(`⚠️ iCal 내 중복 발견: ${listing.name} | ${checkIn} ~ ${checkOut} (인덱스: ${index})`);
                            } else {
                                uniqueReservations.set(key, reservation);
                            }
                        }
                    });
                    
                    if (duplicateInIcal.length > 0) {
                        console.log(`🔍 ${listing.name} iCal 내 중복: ${duplicateInIcal.length}건 (Booking.com에서 중복 전송)`);
                    } else {
                        console.log(`✅ ${listing.name} iCal 내 중복 없음 (정상 데이터)`);
                    }

                    // 🔄 예약 변경사항 감지 및 처리
                    const changes = await handleBookingChanges(listing.name, reservations);

                    // 🚨 오버부킹 방지 체크 (새로운 예약 추가 전)
                    const conflictCount = await resolveBookingConflicts(listing.name, reservations);
                    if (conflictCount > 0) {
                        console.log(`⚠️ ${listing.name} 오버부킹 충돌 ${conflictCount}건 해결됨`);
                    }

                    // 🚨 취소된 예약 처리 (안전한 방식)
                    if (changes.removed.length > 0) {
                        console.log(`⚠️ ${listing.name} 취소된 예약 ${changes.removed.length}건 발견 - 안전하게 처리 중...`);
                        
                        for (const cancelledReservation of changes.removed) {
                            // 취소된 예약을 별도 테이블로 이동 (완전 삭제하지 않음)
                            try {
                                // 취소된 예약을 백업 테이블로 이동
                                await db.query(`
                                    INSERT INTO CustomerInfo_Backup 
                                    (customer_id, name, email, phone_number, passport_number, check_in, check_out, 
                                     reserved_room_number, totalprice, MDFY_DTM, MDFY_ID, 
                                     REG_DTM, REG_ID, cancelled_at, cancellation_reason)
                                    SELECT customer_id, name, email, phone_number, passport_number, check_in, check_out, 
                                           reserved_room_number, totalprice, MDFY_DTM, MDFY_ID, 
                                           REG_DTM, REG_ID, NOW() as cancelled_at, 'booking_cancelled' as cancellation_reason
                                    FROM CustomerInfo 
                                    WHERE customer_id = ?
                                `, [cancelledReservation.customer_id]);
                                
                                // 원본 테이블에서 삭제 (백업 후)
                                await db.query(
                                    `DELETE FROM CustomerInfo WHERE customer_id = ?`,
                                    [cancelledReservation.customer_id]
                                );
                                
                                console.log(`✅ ${listing.name} 취소된 예약 백업 완료: ${cancelledReservation.check_in} ~ ${cancelledReservation.check_out} (ID: ${cancelledReservation.customer_id})`);
                                
                            } catch (error) {
                                console.error(`❌ ${listing.name} 취소된 예약 처리 실패:`, error);
                                // 백업 테이블이 없으면 그냥 로그만 남기고 계속 진행
                                console.log(`⚠️ 백업 테이블이 없어서 취소된 예약을 그대로 유지합니다.`);
                            }
                        }
                    }

                    // 예약 데이터 저장 (중복 방지 + 배치 INSERT)
                    if (reservations.length > 0) {
                        const insertData = reservations
                            .filter(reservation => reservation.start && reservation.end)
                            .map(reservation => {
                    const startDate = new Date(reservation.start);
                    const endDate = new Date(reservation.end);
                    
                    // 한국 시간대로 변환 (UTC+9)
                    const koreaStart = new Date(startDate.getTime() + (9 * 60 * 60 * 1000));
                    const koreaEnd = new Date(endDate.getTime() + (9 * 60 * 60 * 1000));
                    
                                const checkIn = koreaStart.toISOString().split("T")[0].replace(/-/g, '');
                                const checkOut = koreaEnd.toISOString().split("T")[0].replace(/-/g, '');
                                
                                // 🚀 고유 식별자 생성 (중복 방지용)
                                const uniqueId = `${listing.name}_${checkIn}_${checkOut}_${reservation.uid || 'booking'}`;
                                
                                return [listing.name, checkIn, checkOut, uniqueId];
                            });

                        if (insertData.length > 0) {
                            // 🚀 중복 체크 후 INSERT (상세 로깅)
                            let insertedCount = 0;
                            let skippedCount = 0;
                            
                            for (const [room, checkIn, checkOut, uniqueId] of insertData) {
                                // 중복 체크
                                const [existing] = await db.query(
                                    `SELECT customer_id FROM CustomerInfo 
                                     WHERE reserved_room_number = ? AND check_in = ? AND check_out = ? 
                                     AND REG_ID = 'booking' AND name = 'batch'`,
                                    [room, checkIn, checkOut]
                                );

                                if (existing.length === 0) {
                                    // 중복이 없으면 INSERT
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
                                        ['batch', '', '', checkIn, checkOut, room]
                                    );
                                    insertedCount++;
                                    console.log(`✅ 새 예약 추가: ${room} | ${checkIn} ~ ${checkOut}`);
                                } else {
                                    skippedCount++;
                                    console.log(`⚠️ DB 중복 예약 건너뛰기: ${room} | ${checkIn} ~ ${checkOut} (기존 ID: ${existing[0].customer_id})`);
                                }
                            }
                            
                            console.log(`📊 ${listing.name} 저장 결과: ${insertedCount}개 추가, ${skippedCount}개 건너뛰기`);
                        }

                        console.log(`✅ ${listing.name} 예약 ${insertData.length}개 처리 완료`);
                    }

                    return { room: listing.name, count: reservations.length, success: true };
                } catch (error) {
                    console.error(`❌ ${listing.name} 처리 실패:`, error.message);
                    return { room: listing.name, count: 0, success: false, error: error.message };
                }
            });

            // 배치 처리 완료 대기
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // 🚀 배치 간 지연 (서버 부담 최소화)
            if (i + batchSize < bookingListings.length) {
                console.log(`⏳ 서버 부담 최소화를 위해 ${REQUEST_DELAY/1000}초 대기...`);
                await delay(REQUEST_DELAY);
            }
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // 결과 요약
        const successCount = results.filter(r => r.success).length;
        const totalReservations = results.reduce((sum, r) => sum + r.count, 0);
        
        // 🔍 중복 데이터 확인 (삭제하지 않음)
        const duplicateCount = await checkDuplicateBookings();

        console.log(`🎉 Booking.com → 우리 시스템 동기화 완료!`);
        console.log(`📊 처리 결과: ${successCount}/${bookingListings.length} 객실 성공, 총 ${totalReservations}개 예약, 소요시간: ${duration}초`);

        return { success: true, results, duration, totalReservations };
    } catch (error) {
        console.error("❌ Booking.com 동기화 오류 발생:", error);
        return { success: false, error: error.message };
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
            AND REG_ID != 'booking'
            AND TYPE != 'UNAV'
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
        const publicPath = path.join(__dirname, './public/ical');
        
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

// 🕐 2시간마다 자동 실행 설정
cron.schedule("0 */2 * * *", () => {
    console.log("⏰ Booking.com 양방향 동기화 배치 실행 중... (2시간마다)");
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
    roomList,
    checkOverbooking,
    checkAllOverbookings,
    checkRoomOverbookings,
    checkAllOverbookingsController,
    checkRoomOverbookingsController,
    resolveBookingConflicts
};
