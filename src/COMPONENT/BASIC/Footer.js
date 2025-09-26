import React from "react";
import '../../CSS/layout/Header.css';
import {useTranslation} from "react-i18next";

const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-left">
                    <p>{t("110")} | {t("111")}: 김형태 </p>
                    <p>{t("112")}: 740-91-01987</p>
                    <p>{t("113")}: bakho2@naver.com | {t("114")}: 010-8222-7855</p>
                </div>
                <div className="footer-right">
                    <a href="/terms-of-service">{t("115")}</a>  <a href="/privacy-policy">{t("116")}</a>
                </div>
            </div>
            <hr className="footer-divider"/>
            <div className="footer-bottom">
                <p>&copy; 2024 Abcd, Pw</p>
            </div>
        </footer>
    );
};

export default Footer;
