import React, { useEffect, useState } from "react";
import { apiRequest } from "../Util/api";
import "../CSS/style/admin.css";
import { formatDate } from "../Util/utils";
import {useTranslation} from "react-i18next";
import 'bootstrap/dist/css/bootstrap.min.css';
import CalendarTab from "./CalendarTab";
import Spinner from 'react-bootstrap/Spinner';


function Admin() {
    const [activeTab, setActiveTab] = useState("customer");
    const [reservationCustomers, setreservationCustomers] = useState([]);
    const [checkInCustomers, setCheckInCustomers] = useState([]);
    const [checkOutCustomers, setCheckOutCustomers] = useState([]);
    const { t } = useTranslation();

    const [showModal, setShowModal] = useState(false);
    const [smsContent, setSmsContent] = useState("");  // 수정 가능한 메시지
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [smsType, setSmsType] = useState(""); // checkIn2 / checkOut2

    const [bookings ,setBookings] = useState([]);
    const [airbookings ,setAirbookings] = useState([]);
    const [unavailablePeriods, setUnavailablePeriods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [manualPhone, setManualPhone] = useState("");

    const paymentTypeMap = {
        card: '카드결제',
        cash: '현장결제',
    };

    const rooms = [
        {id : 1, name: 'C106'},
        {id : 2, name: 'C107'},
        {id : 3, name: 'C201'},
        {id : 4, name: 'C302'},
        {id : 5, name: 'C305'},
        {id : 6, name: 'C402'},
        {id : 7, name: 'N301'},
        {id : 8, name: 'N103'},
        {id : 9, name: 'N202'},
        {id : 10, name: 'R102'},
        {id : 11, name: 'N303'},
        {id : 12, name: 'N306'},
        {id : 13, name: 'N307'},
        {id : 14, name: 'N203'},
        {id : 15, name: 'N207'},
    ];

    const isWithinAWeek = (dateString) => {
        const today = new Date();
        const targetDate = new Date(dateString);
        const diffTime = Math.abs(today - targetDate);
        return diffTime <= 7 * 24 * 60 * 60 * 1000; // 7일 이내
    };

    const isWithinAWeek2 = (dateString) => {
        const today = new Date();
        const targetDate = new Date(dateString);
        today.setHours(0, 0, 0, 0);
        const twoDaysAfterToday = new Date(today);
        twoDaysAfterToday.setDate(today.getDate() + 2);

        return targetDate >= today && targetDate <= twoDaysAfterToday;
    };

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                if (activeTab === "checkIn") {
                    const data = await apiRequest("/check-in","POST");

                    const formattedData = data.map((customer) => ({
                        ...customer,
                        checkIn: formatDate(customer.checkIn), // 날짜 형식 변환
                    }));

                    setCheckInCustomers(formattedData);
                } else if (activeTab === "checkOut") {
                    const data = await apiRequest("/check-out","POST");
                    const formattedData = data.map((customer) => ({
                        ...customer,
                        checkOut: formatDate(customer.checkOut), // 날짜 형식 변환
                    }));
                    setCheckOutCustomers(formattedData);
                }else if (activeTab === "calendar") {
                    const data = await apiRequest("/calendar_admin","POST");
                    const formattedData = data.map((customer) => ({
                        ...customer,
                    }));
                    setBookings(formattedData);

                    const data2 = await apiRequest("/calendar_airbnb","POST");
                    const formattedData2 = data2.map((customer) => ({
                        ...customer,
                    }));
                    setAirbookings(formattedData2);

                    // 예약불가 기간 가져오기
                    const data3 = await apiRequest("/unavailable-periods","POST");
                    setUnavailablePeriods(data3);
                }else{
                    const data = await apiRequest("/getReservation","POST");

                    const formattedData = data.map((customer) => ({
                        ...customer,
                        checkIn: formatDate(customer.checkInDate),
                        checkOut: formatDate(customer.checkOutDate),
                    }));

                    setreservationCustomers(formattedData);
                }
            } catch (error) {
                console.error("Error fetching customers:", error);
            }finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [activeTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleSendEmail = async (customer, type) => {
        if (!window.confirm("메일을 보내시겠습니까?")) return;

        let endpoint = "";
        let mailpoint = "";
        let statusKey = "";

        if (type === "checkIn") {
            endpoint = "/send-check-in-email";
            mailpoint = "/updateCheckInMailStatus";
            statusKey = "check_in_mail_status";
        } else if (type === "reservation") {
            endpoint = "/send-reservation";
            mailpoint = "/updateReservationMailStatus";
            statusKey = "reservation_mail_status";
        }

        try {
            setLoading(true);

            // 1) 메일 먼저 보냄 (실패하면 여기서 throw)
            const sendResponse = await apiRequest(endpoint, "POST", customer);
            if (!sendResponse) throw new Error("메일 전송 실패");

            // 2) 성공했을 때만 상태 업데이트 호출
            const updatePayload =
                type === "checkIn"
                    ? { id: customer.id } // 서버가 기대하는 키 확인
                    : { customer_id: customer.customer_id };

            const updateResponse = await apiRequest(mailpoint, "POST", updatePayload);
            if (!updateResponse) throw new Error("상태 업데이트 실패");

            // 3) UI 반영
            if (type === "checkIn") {
                setCheckInCustomers(prev =>
                    prev.map(c => c.id === customer.id ? { ...c, [statusKey]: "Y" } : c)
                );
            } else {
                setreservationCustomers(prev =>
                    prev.map(c => c.customer_id === customer.customer_id ? { ...c, [statusKey]: "Y" } : c)
                );
            }
        } catch (error) {
            alert(t("118") + `: ${customer.name}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSMSModal = (customer, type) => {
        let message = ""; // 여기에 기본 message 생성 로직 재사용

        // 간단하게 예시:
        if (type === "checkOut2") {
            message = t("checkout_msg");
        } else if (type === "newMsg") {
            message = "";
        } else {
            message = t(`send_${customer.room}`);
        }

        setSelectedCustomer(customer);
        setSmsType(type);
        setSmsContent(message);
        setShowModal(true);
    };

    const handleSendSMSConfirm = async () => {
        if (!window.confirm("문자를 보내시겠습니까?")) return;

        const targetPhone = selectedCustomer?.phone || manualPhone;
        if (!targetPhone) {
            alert("전화번호를 입력해주세요.");
            return;
        }

        try {
            setLoading(true);
            await handleSendSMS(
                {
                    ...(selectedCustomer || {}),
                    phone: targetPhone,
                    message: smsContent,
                },
                smsType
            );
            setShowModal(false);
        } catch (err) {
            alert("문자 전송 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendSMS = async (customer, type) => {

        let endpoint = "";
        let smspoint = "";
        let statusKey = "";
        let imgUrl = "";

        if(type === "checkIn2"){
            endpoint = "/send-check-in-sms";
            smspoint = "/updateCheckInSmsStatus";
            statusKey = "check_in_message_status";
            imgUrl = 'Y';

        } else if(type === "checkOut2"){
            endpoint = "/send-check-in-sms";
            smspoint = "/updateCheckOutSmsStatus";
            statusKey = "check_out_message_status";
            imgUrl = 'N';
        }

        try {
            const [sendResponse2, updateResponse2] = await Promise.all([
                //apiRequest(endpoint, "POST", { ...customer, imgUrl }),
                apiRequest(smspoint, "POST", customer)
            ]);

            if (sendResponse2 && updateResponse2) {
                // ✅ 상태값 변경하여 UI 업데이트
                if (type === "checkIn2") {
                    setCheckInCustomers(prev =>
                        prev.map(c => c.id === customer.id ? { ...c, [statusKey]: "Y" } : c)
                    );
                } else if (type === "checkOut2") {
                    setCheckOutCustomers(prev =>
                        prev.map(c => c.id === customer.id ? { ...c, [statusKey]: "Y" } : c)
                    );
                }
            } else {
                alert(t("119"));
            }

        } catch (error) {
            alert(t("120"));
        }
    };

    return (
        <div className="container mt-8">
            {loading && (
                <div className="loading-overlay">
                    <Spinner animation="border" variant="primary" />
                    <p>로딩 중...</p>
                </div>
            )}
            <div className="row" style={{marginTop:"100px"}}>
                <div className="col-12">
                    <div className="nav nav-tabs" role="tablist">
                        <button
                            className={`nav-link ${activeTab === "customer" ? "active" : ""}`}
                            onClick={() => handleTabClick("customer")}
                            role="tab"
                        >
                            {t("121")}
                        </button>
                        <button
                            className={`nav-link ${activeTab === "checkIn" ? "active" : ""}`}
                            onClick={() => handleTabClick("checkIn")}
                            role="tab"
                        >
                            {t("122")}
                        </button>
                        <button
                            className={`nav-link ${activeTab === "checkOut" ? "active" : ""}`}
                            onClick={() => handleTabClick("checkOut")}
                            role="tab"
                        >
                            {t("123")}
                        </button>
                        <button
                            className={`nav-link ${activeTab === "calendar" ? "active" : ""}`}
                            onClick={() => handleTabClick("calendar")}
                            role="tab"
                        >
                            달력
                        </button>
                    </div>
                </div>

                <div style={{overflowY: "auto", height: "77vh"}}>
                    <div className="tab-content">
                        {/* 고객관리 탭 */}
                        <div className={`tab-pane fade ${activeTab === "customer" ? "show active" : ""}`} id="customer" role="tabpanel">
                            <table>
                                <colgroup>
                                    <col width="10%"/>
                                    <col width="*"/>
                                    <col width="15%"/>
                                    <col width="10%"/>
                                    <col width="12%"/>
                                    <col width="12%"/>
                                    <col width="10%"/>
                                    <col width="10%"/>
                                </colgroup>
                                <thead>
                                <tr>
                                    <th>{t("124")}</th>
                                    <th>{t("125")}</th>
                                    <th>{t("126")}</th>
                                    <th>{t("127")}</th>
                                    <th>{t("128")}</th>
                                    <th>{t("129")}</th>
                                    <th>{t("159")}</th>
                                    <th>결제타입</th>
                                    <th>{t("131")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reservationCustomers.map((customer) => (
                                    <tr key={customer.customer_id}>
                                        <td>{customer.customer_id}</td>
                                        <td
                                            style={{
                                                textAlign: 'left',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {customer.name}
                                        </td>
                                        <td style={{textAlign: 'left'}}>{customer.phone}</td>
                                        <td>{customer.title}</td>
                                        <td>{customer.checkIn}</td>
                                        <td>{customer.checkOut}</td>
                                        <td>₩{customer.price?.toLocaleString() || '0'}</td>
                                        <td>
                                            <span style={customer.type === 'cash' ? {
                                                backgroundColor: '#e0f3ff',
                                                fontWeight: 'bold',
                                                color: '#007bff',
                                                padding : '7px'
                                            } : {}}>
                                                {paymentTypeMap[customer.type] || ''}
                                            </span>
                                        </td>
                                        <td>
                                            {customer.reservation_mail_status === "N" ? (
                                                <button onClick={() => handleSendEmail(customer, "reservation")}>
                                                    {t("131")}
                                                </button>
                                            ) : (
                                                <span>{t("132")}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {/* 체크인 탭 */}
                        <div className={`tab-pane fade ${activeTab === "checkIn" ? "show active" : ""}`} id="checkIn" role="tabpanel">
                            <table>
                                <colgroup>
                                    <col width="10%"/>
                                    <col width="*"/>
                                    <col width="15%"/>
                                    <col width="15%"/>
                                    <col width="12%"/>
                                </colgroup>
                                <thead>
                                <tr>
                                    <th>{t("133")}</th>
                                    <th>{t("134")}</th>
                                    <th>{t("135")}</th>
                                    <th>{t("136")}</th>
                                    <th>{t("137")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {checkInCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.id}</td>
                                        <td style={{
                                            color: isWithinAWeek(customer.checkIn) ? "red" : "black",
                                            textAlign: 'left'
                                        }}>
                                            {customer.name}
                                        </td>
                                        <td>{customer.room}</td>
                                        <td>{customer.checkIn}</td>
                                        <td>
                                            {customer.check_in_mail_status === "N" ? (
                                                <button onClick={() => handleSendEmail(customer, "checkIn")}>
                                                    {t("145")}
                                                </button>
                                            ) : (
                                                <span>{t("132")}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 체크아웃 탭 */}
                        <div className={`tab-pane fade ${activeTab === "checkOut" ? "show active" : ""}`} id="checkOut"
                             role="tabpanel">
                            <table>
                                <colgroup>
                                    <col width="10%"/>
                                    <col width="*"/>
                                    <col width="15%"/>
                                    <col width="15%"/>
                                </colgroup>
                                <thead>
                                <tr>
                                    <th>{t("133")}</th>
                                    <th>{t("134")}</th>
                                    <th>{t("135")}</th>
                                    <th>{t("129")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {checkOutCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.id}</td>
                                        <td style={{color: isWithinAWeek2(customer.checkOut) ? "red" : "black",textAlign:'left'}}>
                                            {customer.name}
                                        </td>
                                        <td>{customer.room}</td>
                                        <td>{customer.checkOut}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {/* 달력 탭 */}
                        <div className={`tab-pane fade ${activeTab === "calendar" ? "show active" : ""}`} id="calendar"
                             role="tabpanel">
                            <CalendarTab 
                                rooms={rooms} 
                                bookings={bookings} 
                                airbookings={airbookings}
                                unavailablePeriods={unavailablePeriods}
                                onExportIcal={async () => {
                                    try {
                                        // Booking.com으로 예약정보 수동 전송
                                        const response = await apiRequest('/manual-booking-sync', 'GET', { action: 'export_all' });
                                        
                                        if (response.success) {
                                            alert(`Booking.com으로 예약정보 전송 완료!\n전송된 파일: ${response.files?.length || 0}개`);
                                        } else {
                                            throw new Error('전송 실패');
                                        }
                                    } catch (error) {
                                        console.error('Booking.com 전송 오류:', error);
                                        alert('Booking.com으로 예약정보 전송 중 오류가 발생했습니다.');
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
