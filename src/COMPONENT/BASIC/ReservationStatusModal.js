import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../Util/api';

function ReservationStatusModal({ 
    isOpen, 
    onClose, 
    reservation, 
    onUpdate 
}) {
    const [formData, setFormData] = useState({
        customer_id: '',
        check_in: '',
        check_out: '',
        reserved_room_number: '',
        reservation_type: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (reservation && isOpen) {
            setFormData({
                customer_id: reservation.customer_id || '',
                check_in: reservation.check_in || '',
                check_out: reservation.check_out || '',
                reserved_room_number: reservation.reserved_room_number || reservation.room || '',
                reservation_type: reservation.reservation_type || getReservationType(reservation)
            });
        }
    }, [reservation, isOpen]);

    const getReservationType = (reservation) => {
        // REG_ID로 예약 타입 구분
        if (reservation.REG_ID === 'booking') return '부킹닷컴';
        if (reservation.REG_ID === 'batch') return 'AirBnB';
        if (reservation.REG_ID === 'admin') return '에어노량진';
        return '알 수 없음';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            
            // 체크인 날짜가 변경되고, 체크아웃 날짜가 체크인 날짜보다 이전이면 체크아웃 날짜를 체크인 날짜로 설정
            if (name === 'check_in' && value && prev.check_out && value > prev.check_out) {
                newData.check_out = value;
            }
            
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 예약 타입에 따라 다른 API 호출
            const apiEndpoint = formData.reservation_type === '에어노량진' 
                ? '/update-reservation' 
                : '/update-external-reservation';

            const response = await apiRequest(apiEndpoint, 'POST', {
                customer_id: formData.customer_id,
                check_in: formData.check_in,
                check_out: formData.check_out
            });
            
            if (response.success) {
                alert('예약이 성공적으로 수정되었습니다.');
                onUpdate();
                onClose();
            } else {
                alert('예약 수정에 실패했습니다: ' + (response.message || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('예약 수정 오류:', error);
            alert('예약 수정 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', paddingTop: '100px' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">예약 현황</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">예약 ID</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.customer_id}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">예약 타입</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.reservation_type}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">객실번호</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.reserved_room_number}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">고객명</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={reservation?.name || '외부 고객'}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">체크인 날짜</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="check_in"
                                            value={formData.check_in}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">체크아웃 날짜</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="check_out"
                                            value={formData.check_out}
                                            onChange={handleInputChange}
                                            min={formData.check_in}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="alert alert-info">
                                <small>
                                    <strong>참고:</strong> 예약의 체크인/체크아웃 날짜만 수정할 수 있습니다. 
                                    {formData.reservation_type === '에어노량진' 
                                        ? '고객 정보와 객실 정보는 별도로 관리됩니다.'
                                        : '객실번호와 고객 정보는 원본 플랫폼에서 관리됩니다.'
                                    }
                                </small>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={onClose}
                                disabled={loading}
                            >
                                취소
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? '수정 중...' : '수정하기'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ReservationStatusModal;
