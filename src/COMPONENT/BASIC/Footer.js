import React from "react";
import '../../CSS/layout/Header.css'; // CSS 파일 경로를 확인 후 변경하세요

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-left">
                    <p>노량진 | 대표이사: 홍길동 | 사업자등록번호: 123-45-67890</p>
                    <p>메일: abc@naver.com</p>
                    <p>고객센터: 1234-5678</p>
                </div>
                <div className="footer-right">
                    <a href="/privacy-policy">개인정보처리방침</a> | <a href="/terms-of-service">이용약관</a>
                </div>
            </div>
            <hr className="footer-divider" />
            <div className="footer-bottom">
                <p>&copy; 2024 Abcd, Inc.</p>
            </div>
        </footer>
    );
};

export default Footer;
