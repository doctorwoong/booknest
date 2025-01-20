// mail.js
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { exec } = require("child_process");

// Nodemailer transporter 설정
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "teamtoys717@gmail.com",
        pass: "buql mshw uhio fxvm",
    },
});

// 계약서 생성 함수
const generateContract = async (data) => {
    const randomString = Math.random().toString(36).substring(2, 10);
    const todayDate = new Date().toISOString().split("T")[0];
    const wordFileName = `${randomString}_${todayDate}.docx`;
    const pdfFileName = `${randomString}_${todayDate}.pdf`;
    const templatePath = path.join(__dirname, "template/Lease-Agreement-404-rev1.docx");
    const outputPdfDir = path.join(__dirname, "outputPdf/");

    try {
        const template = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(template);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

        doc.render(data);

        const outputDir = path.join(__dirname, "outputDocx/");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const wordFilePath = path.join(outputDir, wordFileName);
        const buffer = doc.getZip().generate({ type: "nodebuffer" });
        fs.writeFileSync(wordFilePath, buffer);

        const libreofficePath = "/opt/homebrew/bin/soffice";
        const command = `${libreofficePath} --headless --convert-to pdf ${wordFilePath} --outdir ${outputPdfDir}`;
        const pdfFilePath = path.join(outputPdfDir, pdfFileName);

        await new Promise((resolve, reject) => {
            exec(command, (err) => (err ? reject(err) : resolve()));
        });

        return pdfFilePath;
    } catch (error) {
        throw error;
    }
};

// 이메일 전송 함수
const sendEmails = async (adminEmail, customerEmail, contractPath, data) => {

    console.log("메일받은 데이터 :", JSON.stringify(data, null, 2));
    console.log("메일받은 데이터2 :", data);
    const adminMailOptions = {
        from: "teamtoys717@gmail.com",
        to: adminEmail,
        subject: `새로운 예약 요청: ${data.name}`,
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
        html: `
            <h2>${data.name}님, 예약이 완료되었습니다.</h2>
            <p>숙소: ${data.title}</p>
            <p>체크인: ${data.checkInDate}</p>
            <p>체크아웃: ${data.checkOutDate}</p>
            <p>첨부된 계약서를 확인해주세요.</p>
        `,
        attachments: [
            {
                filename: "계약서.pdf",
                path: contractPath,
            },
        ],
    };

    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(customerMailOptions);
};

module.exports = { generateContract, sendEmails };
