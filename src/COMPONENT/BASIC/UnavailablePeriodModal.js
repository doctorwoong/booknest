import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../Util/api';

function UnavailablePeriodModal({ 
    isOpen, 
    onClose, 
    selectedRoom, 
    selectedDate,
    onAdd,
    readOnly = false
}) {
    const [formData, setFormData] = useState({
        room: '',
        start_date: '',
        end_date: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && selectedRoom && selectedDate) {
            setFormData({
                room: selectedRoom,
                start_date: selectedDate,
                end_date: selectedDate,
                reason: ''
            });
        }
    }, [isOpen, selectedRoom, selectedDate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.start_date || !formData.end_date) {
            alert('시작일과 종료일을 모두 입력해주세요.');
            return;
        }

        if (new Date(formData.start_date) > new Date(formData.end_date)) {
            alert('시작일은 종료일보다 이전이어야 합니다.');
            return;
        }

        setLoading(true);

        try {
            const response = await apiRequest('/add-unavailable-period', 'POST', formData);
            
            if (response.success) {
                alert('예약불가 기간이 성공적으로 추가되었습니다.');
                onAdd();
                onClose();
            } else {
                alert('예약불가 기간 추가에 실패했습니다: ' + (response.message || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('예약불가 기간 추가 오류:', error);
            alert('예약불가 기간 추가 중 오류가 발생했습니다.');
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
                        <h5 className="modal-title">예약불가 기간 추가</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">객실</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.room}
                                    disabled
                                />
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">시작일</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">종료일</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="end_date"
                                            value={formData.end_date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">사유 (선택사항)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    placeholder="예: 청소, 수리, 개인사정 등"
                                />
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            {!readOnly ? (
                                <>
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
                                        className="btn btn-warning"
                                        disabled={loading}
                                    >
                                        {loading ? '추가 중...' : '예약불가 추가'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    취소
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UnavailablePeriodModal;
