import React, { useEffect, useState } from "react";
import { apiRequest } from "../Util/api";
import "../CSS/style/admin.css";
import { formatDate } from "../Util/utils";

function Admin() {
    const [activeTab, setActiveTab] = useState("checkIn");
    const [checkInCustomers, setCheckInCustomers] = useState([]);
    const [checkOutCustomers, setCheckOutCustomers] = useState([]);

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
                }else{
                    const data = await apiRequest("/check-in","POST");

                    const formattedData = data.map((customer) => ({
                        ...customer,
                        checkIn: formatDate(customer.checkIn), // 날짜 형식 변환
                    }));

                    setCheckInCustomers(formattedData);
                }
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        };

        fetchCustomers();
    }, [activeTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleSendEmail = async (customer, type) => {
        const endpoint = type === "checkIn" ? "/send-check-in-email" : "/send-check-out-email";
        try {
            await apiRequest(endpoint, "POST", { id: customer.id });
            alert(`메일이 전송되었습니다: ${customer.name}`);
            // 상태값 업데이트
            if (type === "checkIn") {
                setCheckInCustomers((prev) =>
                    prev.map((item) =>
                        item.id === customer.id ? { ...item, check_in_message_status: "Y" } : item
                    )
                );
            } else {
                setCheckOutCustomers((prev) =>
                    prev.map((item) =>
                        item.id === customer.id ? { ...item, check_out_message_status: "Y" } : item
                    )
                );
            }
        } catch (error) {
            console.error("메일 전송 오류:", error);
            alert("메일 전송에 실패했습니다.");
        }
    };

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="nav nav-tabs" role="tablist">
                        <button
                            className={`nav-link ${activeTab === "checkIn" ? "active" : ""}`}
                            onClick={() => handleTabClick("checkIn")}
                            role="tab"
                        >
                            체크인
                        </button>
                        <button
                            className={`nav-link ${activeTab === "checkOut" ? "active" : ""}`}
                            onClick={() => handleTabClick("checkOut")}
                            role="tab"
                        >
                            체크아웃
                        </button>
                    </div>
                </div>

                <div className="col-12 mt-3" style={{overflowY: "scroll", height: "65vh"}}>
                    <div className="tab-content">
                        {/* 체크인 탭 */}
                        <div
                            className={`tab-pane fade ${activeTab === "checkIn" ? "show active" : ""}`}
                            id="checkIn"
                            role="tabpanel"
                        >
                            <h4>체크인</h4>
                            <table border="1" style={{ width: "90%", textAlign: "center", borderCollapse: "collapse" }}>
                                <thead>
                                <tr>
                                    <th>고객번호</th>
                                    <th>고객명</th>
                                    <th>호실</th>
                                    <th>체크인일</th>
                                    <th>메일</th>
                                </tr>
                                </thead>
                                <tbody>
                                {checkInCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.id}</td>
                                        <td
                                            style={{
                                                color: isWithinAWeek(customer.checkIn) ? "red" : "black",
                                            }}
                                        >
                                            {customer.name}
                                        </td>
                                        <td>{customer.room}</td>
                                        <td>{customer.checkIn}</td>
                                        <td>
                                            {customer.check_in_message_status === "N" ? (
                                                <button onClick={() => handleSendEmail(customer, "checkIn")}>
                                                    메일 전송
                                                </button>
                                            ) : (
                                                "보냄"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 체크아웃 탭 */}
                        <div
                            className={`tab-pane fade ${activeTab === "checkOut" ? "show active" : ""}`}
                            id="checkOut"
                            role="tabpanel"
                        >
                            <h4>체크아웃</h4>
                            <table border="1" style={{ width: "90%", textAlign: "center", borderCollapse: "collapse" }}>
                                <thead>
                                <tr>
                                    <th>고객번호</th>
                                    <th>고객명</th>
                                    <th>호실</th>
                                    <th>체크아웃일</th>
                                    <th>메일</th>
                                </tr>
                                </thead>
                                <tbody>
                                {checkOutCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.id}</td>
                                        <td
                                            style={{
                                                color: isWithinAWeek2(customer.checkOut) ? "red" : "black",
                                            }}
                                        >
                                            {customer.name}
                                        </td>
                                        <td>{customer.room}</td>
                                        <td>{customer.checkOut}</td>
                                        <td>
                                            {customer.check_out_message_status === "N" ? (
                                                <button onClick={() => handleSendEmail(customer, "checkOut")}>
                                                    메일 전송
                                                </button>
                                            ) : (
                                                "보냄"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
