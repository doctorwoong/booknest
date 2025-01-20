const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { exec } = require("child_process");

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors());

// 랜덤 난수 생성
const generateRandomString = (length = 8) => {
    return Math.random().toString(36).substring(2, 2 + length);
};

// 오늘 날짜 포맷
const getFormattedDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

// 파일 이름 생성
const randomString = generateRandomString();
const todayDate = getFormattedDate();
const wordFileName = `${randomString}_${todayDate}.docx`;
const pdfFileName = `${randomString}_${todayDate}.pdf`;


// Nodemailer transporter 설정
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "teamtoys717@gmail.com",
        pass: "buql mshw uhio fxvm", // 발신자 이메일 비밀번호 또는 앱 비밀번호
    },
});

// PDF/Word 파일 생성 함수
const generateContract = async (data) => {
    const templatePath = "../public/resource/template/Lease-Agreement-404-rev1.docx"; // Word 템플릿 파일 경로
    const outputPdfDir = path.join(__dirname, "../public/resource/outputPdf/");

    try {
        // 템플릿 파일 읽기
        const template = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(template);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

        // 데이터 삽입
        doc.render(data);

        // 디렉토리 경로 설정
        const outputDir = path.join(__dirname, "../public/resource/outputDocx/");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Word 파일 저장
        const wordFilePath = path.join(outputDir, wordFileName);
        const buffer = doc.getZip().generate({ type: "nodebuffer" });
        fs.writeFileSync(wordFilePath, buffer);
        console.log(`Word file created: ${wordFilePath}`);

        // PDF 변환
        const libreofficePath = "/opt/homebrew/bin/soffice"; // LibreOffice 경로
        const command = `${libreofficePath} --headless --convert-to pdf ${wordFilePath} --outdir ${outputPdfDir}`;
        const pdfFilePath = path.join(outputPdfDir, pdfFileName);

        await new Promise((resolve, reject) => {
            exec(command, (err) => {
                if (err) {
                    console.error("LibreOffice conversion failed:", err);
                    reject(err);
                } else {
                    console.log(`PDF file created: ${pdfFilePath}`);
                    resolve();
                }
            });
        });

        // 반환된 파일 경로
        return pdfFilePath;
    } catch (error) {
        console.error("파일 생성 실패:", error);
        throw error;
    }
};

// 예약 정보 이메일 발송
app.post("/send-reservation", async (req, res) => {
    const { name, phone, email, checkinDate, checkoutDate, title } = req.body;

    // 계약서 데이터
    const contractData = {
        date: new Date().toLocaleDateString(),
        ho: "102",
        full_date: `${checkinDate} to ${checkoutDate}`,
        passport: "M12345678",
        phone: phone,
        name: name,
    };

    try {
        // 계약서 파일 생성
        const contractPath = await generateContract(contractData);

        console.log("contractPath : " + contractPath);


        const outputPdfDir = path.join(__dirname, "../public/resource/outputPdf/");
        const pdfFilePath = path.resolve(outputPdfDir, pdfFileName);

        console.log("현재 내 파일 이름 : " + pdfFilePath);

        // 이메일 내용 설정
        const adminMailOptions = {
            from: "chunwoong0104@gmail.com", // 발신자 이메일
            to: "showth1720@naver.com", // 관리자가 받을 이메일 parks@teamtoys.works
            subject: `새로운 예약 요청: ${name}`,
            html: `
                <h2>새로운 예약 요청이 도착했습니다.</h2>
                <p><b>이름:</b> ${name}</p>
                <p><b>전화번호:</b> ${phone}</p>
                <p><b>이메일:</b> ${email}</p>
                <p><b>숙소:</b> ${title}</p>
                <p><b>체크인:</b> ${checkinDate}</p>
                <p><b>체크아웃:</b> ${checkoutDate}</p>
            `,
        };

        const customerMailOptions = {
            from: "chunwoong0104@gmail.com",
            to: email, // 고객 이메일
            subject: "예약이 완료되었습니다!",
            html: `
                <h2>${name}님, 예약이 완료되었습니다.</h2>
                <p>숙소: ${title}</p>
                <p>체크인: ${checkinDate}</p>
                <p>체크아웃: ${checkoutDate}</p>
                <p>첨부된 계약서를 확인해주세요.</p>
            `,
            attachments: [
                {
                    filename: "계약서.pdf", // 첨부파일 이름
                    path: contractPath, // 동적으로 생성된 PDF 경로
                },
            ],
        };

        // 이메일 발송
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(customerMailOptions);

        res.status(200).send("이메일 발송 성공");
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).send("이메일 발송 실패");
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

