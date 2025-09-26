// mail.js
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { exec } = require("child_process");

// ===== 경로/실행 환경 설정 (배포 안전) =====
const PROJECT_ROOT = process.cwd(); // 실행 위치와 무관하게 프로젝트 루트 기준
const TEMPLATE_DIR = process.env.TEMPLATE_DIR || path.resolve(PROJECT_ROOT, "template");
const CHECKIN_IMG_DIR = process.env.CHECKIN_IMG_DIR || path.resolve(TEMPLATE_DIR, "CheckIn");

// OS별 LibreOffice 바이너리 (환경변수 우선)
const SOFFICE_BIN =
    process.env.LIBREOFFICE_BIN ||
    (process.platform === "win32" ? "soffice" : "/opt/homebrew/bin/soffice");

// ===== Nodemailer transporter 설정 (변경 없음) =====
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "teamtoys717@gmail.com",
        pass: "buql mshw uhio fxvm",
    },
});

// ===== 계약서 생성 함수 =====
const generateContract = async (data) => {
    const randomString = Math.random().toString(36).substring(2, 10);
    const todayDate = new Date().toISOString().split("T")[0];
    const wordFileName = `${randomString}_${todayDate}.docx`;
    const pdfFileName = `${randomString}_${todayDate}.pdf`;

    // 템플릿/출력 경로 절대값
    const templatePath = path.resolve(TEMPLATE_DIR, "Lease-Agreement-404-rev1.docx");
    const outputDocxDir = path.resolve(PROJECT_ROOT, "outputDocx");
    const outputPdfDir = path.resolve(PROJECT_ROOT, "outputPdf");

    try {
        // 디렉토리 존재 보장
        if (!fs.existsSync(outputDocxDir)) fs.mkdirSync(outputDocxDir, { recursive: true });
        if (!fs.existsSync(outputPdfDir)) fs.mkdirSync(outputPdfDir, { recursive: true });

        // 템플릿 존재 확인(에러 메시지 명확화)
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        const template = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(template);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

        doc.render(data);

        const wordFilePath = path.join(outputDocxDir, wordFileName);
        const buffer = doc.getZip().generate({ type: "nodebuffer" });
        fs.writeFileSync(wordFilePath, buffer);

        // 경로에 공백 대비해서 따옴표로 감쌈
        const command = `"${SOFFICE_BIN}" --headless --convert-to pdf "${wordFilePath}" --outdir "${outputPdfDir}"`;
        const pdfFilePath = path.join(outputPdfDir, pdfFileName);

        await new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve();
            });
        });

        return pdfFilePath;
    } catch (error) {
        throw error;
    }
};

// ===== 이메일 전송 함수 =====
const sendEmails = async (adminEmail, customerEmail, contractPath, data) => {
    console.log("메일받은 데이터 :", JSON.stringify(data, null, 2));
    console.log("메일받은 데이터2 :", data);

    const adminMailOptions = {
        from: "teamtoys717@gmail.com",
        to: adminEmail,
        subject: `새로운 예약 요청: ${data.name}`,
        cc: ["bakho2@naver.com", "kangmd78@nate.com"],
        html: `
      <h2>새로운 예약 요청이 도착했습니다.</h2>
      <p><b>이름:</b> ${data.name}</p>
      <p><b>전화번호:</b> ${data.phone}</p>
      <p><b>숙소:</b> ${data.title}</p>
    `,
    };

    const customerMailOptions = {
        from: "teamtoys717@gmail.com",
        to: customerEmail,
        subject: "예약이 완료되었습니다!",
        cc: ["bakho2@naver.com", "kangmd78@nate.com"],
        html: `
      <h2>${data.name}님, 예약이 완료되었습니다.</h2>
      <p>숙소: ${data.title}</p>
      <p>체크인: ${data.checkInDate}</p>
      <p>체크아웃: ${data.checkOutDate}</p>
      <p>첨부된 계약서를 확인해주세요.</p>
    `,
        attachments: [
            {
                filename: "rental_agreement.pdf",
                path: contractPath,
            },
        ],
    };

    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(customerMailOptions);
};

// ===== 체크인 안내 메일 (첨부 이미지 경로 절대값) =====
const sendCheckInEmail = async (customerEmail, title) => {
    const checkInImageDir = CHECKIN_IMG_DIR;

    let imageAttachments = [];

    try {
        const files = fs.readdirSync(checkInImageDir);
        imageAttachments = files
            .filter((file) => file.toLowerCase().endsWith(".jpg")) // .jpg만
            .map((file) => ({
                filename: file,
                path: path.join(checkInImageDir, file),
            }));
    } catch (error) {
        console.error("📂 이미지 파일을 불러오는 중 오류 발생:", error);
    }

    let contents = "";

    switch (title) {
        case "R102":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 102 and the door lock password is 12388*. <br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime102 and  the password is \"12318102\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day. ";
            break;
        case "N103":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 103 and the door lock password is 11038*. <br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime103 and  the password is \"11038103h\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day. ";
            break;
        case "K105":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 105 and the door lock password is 12358*. <br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime7855-5G or iptime7855, and  the password is \"korea7855\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day. ";
            break;
        case "C106":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 106 and the door lock password is 10618*. <br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime106, and  the password is \"10618106h\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day.";
            break;
        case "C107":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 107 and the door lock password is 12378*. <br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime107, and  the password is 107iptime.<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day. ";
            break;
        case "C201":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 201 and the door lock password is *20128* or *12388*.<br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is TP Link F20E pch, and  the password is \"qkrckdgus1!\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference. <br>" +
                "Have a good day. ";
            break;
        case "N202":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 202 and the door lock password is 13388*. 1234*<br>" +
                "Touch the door lock with your hand, and you'll see the numbers and press the password.<br>" +
                "Wifi is iptime202, and  the password is \"13328202h\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day. ";
            break;
        case "N301":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 301 and the door lock password is 0525*. <br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime301, and  the password is \"iptime301st\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day.";
            break;
        case "C302":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 302 and the door lock password is 12388*. <br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime302, and  the password is \"2580302h\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day.";
            break;
        case "N303":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 303 and the door lock password is 30388*. <br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime303 and  the password is \"13038303h\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day.";
            break;
        case "C305":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 305 and the door lock password is 12388*.<br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime305, and  the password is 12388305.<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day. ";
            break;
        case "N306":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 306 and the door lock password is 30618*.<br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime306, and  the password is 3061234h.<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day.";
            break;
        case "N307":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 307 and the door lock password is 3695*.<br>" +
                "Touch the door lock with your hand, and you'll see the numbers and press the password.<br>" +
                "Wifi is iptime306, and  the password is 3695307h.<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day.";
            break;
        case "C402":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 402 and the first door lock password is 12388* and 2nd door lock password is 14028*.<br>" +
                "Your room is on the fourth floor. If you go straight inside from the third floor, you will find the stairs leading to the fourth floor.<br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime402, and  the password is \"iptime14028\".<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see \"Coffee namu(커피나무)\" coffee shop, turn to the left, and go up 150m. When you see \"Hyerimjae\" building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day.";
            break;

        case "N203":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 203 and the door lock password is 12038* <br>" +
                "Lift up the doorlock cover and press the password and press down the cover. <br>" +
                "Wifi is iptime203, and  the password is 20312388. <br>" +
                "For your reference, I explain how to find the studio. <br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see Coffee namu(커피나무) coffee shop, turn to the left, and go up 150m. When you see Hyerimjae building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day";
            break;

        case "N207":
            contents = "Hello. <br>" +
                "I am  the host who runs the accommodation you booked.<br>" +
                "<br>" +
                "The address  of the studio is \"25, Manyang-ro 14ma-gil, Dongjak-gu, Seoul, Republic of Korea\".<br>" +
                "Zip code is 06914.<br>" +
                "Please find exit no. 3 at Noryangjin subway station in line 9. <br>" +
                "You can find the studio in a map application with the address.<br>" +
                "For your reference, the address in Korean is \"서울시 동작구 만양로14마길 25\" <br>" +
                "<br>" +
                "I inform you of the information about the room in advance.<br>" +
                "Your room number is 207 and the door lock password is 12378*.<br>" +
                "Lift up the doorlock cover and press the password and press down the cover.<br>" +
                "Wifi is iptime207, and  the password is '20712345'.<br>" +
                "For your reference, I explain how to find the studio.<br>" +
                "Please find exit no. 3 at Norangjin subway station in line 9. Turn to the right. The direction is for Yongsan and Hanriver bringe, and go straight about 500m, and when you find Ediya coffee shop on the right, turn to the right and go straight about 100m. When you see Coffee namu(커피나무) coffee shop, turn to the left, and go up 150m. When you see 'Hyerimjae' building, turn to the right. You can find the studio on the right. <br>" +
                "Please find attached picture for your reference.<br>" +
                "Have a good day.";
            break;
        default:
            contents = "안녕하세요, 체크인 안내드립니다.";
            break;
    }

    const customerMailOptions = {
        from: `"airbnbnoryangjin" <teamtoys717@gmail.com>`,
        to: customerEmail,
        subject: "체크인 1주일 전 안내",
        cc: ["bakho2@naver.com", "kangmd78@nate.com"],
        html: `<p>${contents}</p>`,
        attachments: [...imageAttachments],
    };

    await transporter.sendMail(customerMailOptions);
};

async function sendCancelEmail(resv) {
    // 필요한 필드만 방어적으로 추출
    const email = resv.email;
    const name = resv.name;
    const room = resv.reserved_room_number;
    const checkInDate  = resv.checkInDate  || resv.check_in  || resv.check_in_date;
    const checkOutDate = resv.checkOutDate || resv.check_out || resv.check_out_date;

    if (!email) throw new Error("customer email is required");

    const html = `
    <h2>${name || "고객"}님, 예약 취소 안내</h2>
    <p>다음 예약이 취소되었습니다.</p>
    <ul>
      <li>객실: <b>${room ?? "-"}</b></li>
      <li>체크인: <b>${checkInDate ?? "-"}</b></li>
      <li>체크아웃: <b>${checkOutDate ?? "-"}</b></li>
    </ul>
    <p>문의가 있으시면 회신 부탁드립니다.</p>
  `;

    const mailOptions = {
        from: "teamtoys717@gmail.com",
        to: email,
        subject: "예약 취소 안내",
        html,
    };

    await transporter.sendMail(mailOptions);
};


module.exports = {generateContract, sendEmails, sendCheckInEmail, sendCancelEmail};
