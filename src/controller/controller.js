const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const { autoExportIcalAfterReservation } = require('./bookingSync');

// MySQL 연결 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    timezone: process.env.DB_TIMEZONE
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected!');
        connection.release();
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
})();

// MainRoom 가져오기 함수
const getMainRoom = async (req, res) => {
    console.log("req.body : ", JSON.stringify(req.body, null, 2));
    try {
        const { startDate, endDate } = req.body;

        const query = `
            SELECT
                A.seq,
                A.room_number,
                A.images,
                FLOOR(A.price) AS price,
                A.reservation_status,
                (select count(*) from Review B where B.room_number = A.room_number) reviewNum,
                IFNULL((select FORMAT(AVG(rating), 1) from Review B where B.room_number = A.room_number),0.0) rating
            FROM
                RoomInfo A
            WHERE
                room_number NOT IN (
                    SELECT
                        reserved_room_number
                    FROM
                        CustomerInfo
                    WHERE
                        STR_TO_DATE(check_in, '%Y%m%d') < STR_TO_DATE(?, '%Y%m%d') AND
                        STR_TO_DATE(check_out, '%Y%m%d') > STR_TO_DATE(?, '%Y%m%d')
                )
            and reservation_status = 'available'
        `;

        // 쿼리와 파라미터를 로그로 출력
        console.log("SQL Query: ", query);
        console.log("SQL Parameters: ", [endDate, startDate]);

        // 쿼리 실행
        const [rows] = await pool.query(query, [endDate, startDate]);
        res.json(rows); // 결과를 JSON 형식으로 반환
    } catch (err) {
        console.error("Database query error:", err); // 에러 상세 출력
        res.status(500).send("Database query failed");
    }
};


const insertReservation = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            passport,
            checkInDate,
            checkOutDate,
            title,
            price,
            type
        } = req.body;
        console.log("insertReservation body : ",req.body)
        const query = `
            INSERT INTO CustomerInfo (
              name, 
              email, 
              phone_number, 
              passport_number, 
              check_in, 
              check_out, 
              check_in_message_status, 
              check_out_message_status, 
              reserved_room_number,
              totalprice,
              MDFY_DTM,
              MDFY_ID,
              REG_DTM,
              REG_ID,
              TYPE
            ) VALUES (?, ?, ?, ?, ?, ?,'N','N', ?, ?, NOW(),'admin',NOW(),'admin',?)
        `;

        const [result] = await pool.query(query, [
            name,
            email,
            phone,
            passport,
            checkInDate,
            checkOutDate,
            title,
            price,type
        ]);

        console.log('Reservation inserted:', result);
        
        // ✅ 예약 후 자동 iCal 내보내기
        try {
            await autoExportIcalAfterReservation({
                name,
                email,
                phone,
                checkInDate,
                checkOutDate,
                title,
                price,
                type
            });
        } catch (icalError) {
            console.error('iCal 자동 내보내기 실패:', icalError);
            // iCal 실패해도 예약은 성공으로 처리
        }
        
        res.status(201).send({ message: 'Reservation successfully added!' });
    } catch (err) {
        console.error('Database query error:', err); // 에러 상세 출력
        res.status(500).send('Failed to insert reservation');
    }
};

const getCheckInCustomers = async (req, res) => {
    try {
        const query = `
            SELECT
                customer_id AS id,
                name,
                email,
                phone_number as phone,
                reserved_room_number AS room,
                check_in AS checkIn,
                check_in_message_status,
                check_in_mail_status,
                STR_TO_DATE(check_in, '%Y%m%d') AS checkInDate
            FROM
                CustomerInfo
            where 1=1
              AND REG_ID != 'batch'
            ORDER BY
                CASE
                    WHEN STR_TO_DATE(check_in, '%Y%m%d') BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1
                    ELSE 2
                    END,
                STR_TO_DATE(check_in, '%Y%m%d');
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching check-in data:', err);

        // 에러 발생 시 500 상태와 에러 메시지 반환
        res.status(500).send('Error fetching check-in data');
    }
};

const getCheckOutCustomers = async (req, res) => {
    try {
        const query = `
            SELECT
                customer_id AS id,
                name,
                email,
                phone_number as phone,
                reserved_room_number AS room,
                check_out AS checkOut,
                check_out_message_status,
                check_out_mail_status,
                STR_TO_DATE(check_out, '%Y%m%d') AS checkOutDate
            FROM
                CustomerInfo
            where 1=1
              AND REG_ID != 'batch'
            ORDER BY
                CASE
                    WHEN STR_TO_DATE(check_out, '%Y%m%d') >= CURDATE() THEN 1
                    ELSE 2
                    END,
                STR_TO_DATE(check_out, '%Y%m%d')
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching check-in data:', err);

        // 에러 발생 시 500 상태와 에러 메시지 반환
        res.status(500).send('Error fetching check-in data');
    }
};

const getCheckCustomers = async (req, res) => {
    try {
        const { name } = req.body; // POST 요청에서 body에서 데이터 가져옴

        if (!name) {
            return res.status(400).send("Name parameter is required");
        }

        const query = `
            SELECT A.customer_id,
                   A.name,
                   A.email,
                   A.phone_number,
                   A.check_in,
                   A.check_out,
                   A.reserved_room_number,
                   (SELECT B.images FROM RoomInfo B WHERE A.reserved_room_number = B.room_number LIMIT 1) AS img
            FROM CustomerInfo A
            WHERE A.name like ?
        `;

        const [rows] = await pool.query(query, [`%${name}%`]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const getReviews = async (req, res) => {
    try {
        const { roomNumber } = req.params; // GET 요청의 URL 경로에서 roomNumber를 가져옴

        if (!roomNumber) {
            return res.status(400).send("Room number parameter is required");
        }

        const query = `
            SELECT
                review_id,
                customer_name,
                review_text,
                rating,
                DATE_FORMAT(REG_DTM, '%Y-%m-%d') AS formatted_date
            FROM
                Review
            WHERE
                room_number = ?;
        `;

        const [rows] = await pool.query(query, [roomNumber]); // roomNumber를 파라미터로 전달
        res.json(rows);
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).send("Error fetching reviews");
    }
};

const deleteReservation = async (req, res) => {
    try {
        const { id } = req.body; // POST 요청에서 body에서 데이터 가져옴

        if (!id) {
            return res.status(400).send("id parameter is required");
        }
        const query = `
            delete from CustomerInfo
            where customer_id = ?
        `;
        const [rows] = await pool.query(query, [id]); // id 파라미터로 전달
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const getReviewCustomer = async (req, res) => {
    try {
        const query = `
            SELECT
                A.customer_id,
                A.name,
                A.email,
                A.check_in,
                A.check_out,
                A.reserved_room_number,
                A.phone_number,
                (SELECT B.images FROM RoomInfo B WHERE A.reserved_room_number = B.room_number LIMIT 1) AS img
            FROM
                CustomerInfo A
            WHERE
                STR_TO_DATE(A.check_out, '%Y%m%d') BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              AND CURDATE()
            AND REG_ID != 'batch';
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const getCustmerReview = async (req, res) => {
    try {
        const { customer_id } = req.params;

        if (!customer_id) {
            return res.status(400).send("customer_id parameter is required");
        }
        const query = `
            select
                review_id,
                customer_id ,
                review_text reviewText,
                rating ,
                DATE_FORMAT(REG_DTM, '%Y-%m-%d %H:%i:%s') AS REG_DTM,
                DATE_FORMAT(MDFY_DTM, '%Y-%m-%d %H:%i:%s') AS MDFY_DTM
            from Review
            where customer_id = ?
        `;
        const [rows] = await pool.query(query, [customer_id]); // id 파라미터로 전달
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const updateReview = async (req, res) => {
    try {
        const { rating,reviewText,id } = req.body;

        if (!id && !rating && !reviewText) {
            return res.status(400).send("customer_id parameter is required");
        }
        const query = `
            update Review
            set review_text = ?
                , rating = ?
                , MDFY_DTM = now()
            where review_id = ?
        `;
        const [rows] = await pool.query(query, [reviewText ,rating ,id]);
        console.log("SQL Query: ", query);
        console.log("SQL Parameters: ", [reviewText ,rating ,id]);// id 파라미터로 전달
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const writeReview = async (req, res) => {
    try {
        const { rating,reviewText,name,reserved_room_number,customer_id } = req.body;

        if (!customer_id && !rating && !reviewText && !name && !reserved_room_number) {
            return res.status(400).send("customer_id parameter is required");
        }
        const query = `
            insert into Review (customer_id,
                                customer_name,
                                room_number,
                                review_text,
                                rating,
                                MDFY_DTM,
                                MDFY_ID,
                                REG_DTM,
                                REG_ID)
            values (?,?,?,?,?,now(),'admin',now(),'admin')
        `;
        const [rows] = await pool.query(query, [customer_id ,name ,reserved_room_number,reviewText,rating]); // id 파라미터로 전달
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const deleteReview = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).send("customer_id parameter is required");
        }
        const query = `
            delete FROM Review
            where review_id = ?
        `;
        const [rows] = await pool.query(query, [id]); // id 파라미터로 전달

        console.log("SQL Query: ", query);
        console.log("SQL Parameters: ", [id]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const getReservationCustomers = async (req, res) => {
    try {
        const query = `
            select
                customer_id,
                name as name,
                phone_number as phone,
                email as email,
                passport_number as passport,
                check_in as checkInDate,
                check_out as checkOutDate,
                reserved_room_number as title,
                totalprice as price,
                reservation_mail_status,
                TYPE as type
            from CustomerInfo
            where 1=1
                AND REG_ID != 'batch'
            order by customer_id desc
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error getReservationCustomers data:', err);

        // 에러 발생 시 500 상태와 에러 메시지 반환
        res.status(500).send('Error getReservationCustomers data');
    }
};

const updateCheckInMailStatus = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {return res.status(400).send("customer_id parameter is required");}

        const query = `update CustomerInfo set check_in_mail_status = 'Y' where customer_id = ?`;
        const [rows] = await pool.query(query, [id]); // id 파라미터로 전달

        console.log("SQL Query: ", query);
        console.log("SQL Parameters: ", [id]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const updateCheckOutMailStatus = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {return res.status(400).send("customer_id parameter is required");}

        const query = `update CustomerInfo set check_out_mail_status = 'Y' where customer_id = ?`;
        const [rows] = await pool.query(query, [id]); // id 파라미터로 전달

        console.log("SQL Query: ", query);
        console.log("SQL Parameters: ", [id]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const updateReservationMailStatus = async (req, res) => {
    try {
        const { customer_id } = req.body;
        if (!customer_id) {return res.status(400).send("customer_id parameter is required");}

        const query = `update CustomerInfo set reservation_mail_status = 'Y' where customer_id = ?`;
        const [rows] = await pool.query(query, [customer_id]); // id 파라미터로 전달

        console.log("SQL Query: ", query);
        console.log("SQL Parameters: ", [customer_id]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const updateCheckInSmsStatus = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {return res.status(400).send("customer_id parameter is required");}

        const query = `update CustomerInfo set check_in_message_status = 'Y' where customer_id = ?`;
        const [rows] = await pool.query(query, [id]); // id 파라미터로 전달

        console.log("SQL Query: ", query);
        console.log("SQL Parameters: ", [id]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const updateCheckOutSmsStatus = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {return res.status(400).send("customer_id parameter is required");}

        const query = `update CustomerInfo set check_out_message_status = 'Y' where customer_id = ?`;
        const [rows] = await pool.query(query, [id]); // id 파라미터로 전달

        console.log("SQL Query: ", query);
        console.log("SQL Parameters: ", [id]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching check data:", err);
        res.status(500).send("Error fetching check data");
    }
};

const getCalendarAdmin = async (req, res) => {
    try {
        const query = `
            SELECT
                reserved_room_number AS room,
                DATE_FORMAT(STR_TO_DATE(check_in, '%Y%m%d'), '%Y-%m-%d') AS check_in,
                DATE_FORMAT(DATE_ADD(STR_TO_DATE(check_out, '%Y%m%d'), INTERVAL 1 DAY), '%Y-%m-%d') AS check_out
            FROM CustomerInfo
            WHERE MDFY_ID != 'booking' AND MDFY_ID != 'batch'
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching check-in data:', err);

        // 에러 발생 시 500 상태와 에러 메시지 반환
        res.status(500).send('Error fetching check-in data');
    }
};
const getCalendarAirbnb = async (req, res) => {
    try {
        const query = `
            SELECT
                reserved_room_number AS room,
                DATE_FORMAT(DATE_ADD(STR_TO_DATE(check_in, '%Y%m%d'), INTERVAL 1 DAY), '%Y-%m-%d') AS check_in,
                DATE_FORMAT(DATE_ADD(STR_TO_DATE(check_out, '%Y%m%d'), INTERVAL 1 DAY), '%Y-%m-%d') AS check_out,
                DATE_FORMAT(DATE_ADD(REG_DTM, INTERVAL 9 HOUR), '%Y-%m-%d %H:%i') AS REG_DTM
            FROM CustomerInfo
            WHERE MDFY_ID = 'booking' OR MDFY_ID = 'batch'
            order by customer_id desc
        `;
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching check-in data:', err);

        // 에러 발생 시 500 상태와 에러 메시지 반환
        res.status(500).send('Error fetching check-in data');
    }
};



module.exports = {getMainRoom, insertReservation, getCheckInCustomers,getCheckOutCustomers,getCheckCustomers,
    getReviews ,deleteReservation ,getReviewCustomer, getCustmerReview,updateReview,writeReview ,deleteReview
    ,getReservationCustomers ,updateCheckInMailStatus ,updateCheckOutMailStatus ,updateReservationMailStatus, updateCheckInSmsStatus,updateCheckOutSmsStatus
    ,getCalendarAdmin,getCalendarAirbnb };
