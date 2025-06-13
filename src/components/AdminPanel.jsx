import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { useWeb3 } from '../contexts/Web3Context';

const AdminPanel = () => {
  const { 
    contract, 
    account, 
    isAdmin, 
    getContractInfo,
    chonNguoiNhanHui,
    traTienHui,
    traLaiTienKyQuy,
    xuLyViPham
  } = useWeb3();
  
  const [contractInfo, setContractInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!contract || !account || !isAdmin) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const info = await getContractInfo();
        setContractInfo(info);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin hợp đồng:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInfo();
    
    // Cập nhật thông tin mỗi 10 giây
    const intervalId = setInterval(fetchInfo, 10000);
    
    return () => clearInterval(intervalId);
  }, [contract, account, isAdmin, getContractInfo]);

  // Xử lý nút chọn người nhận hụi
  const handleSelectWinner = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      await chonNguoiNhanHui();
      
      setSuccess("Đã chọn người nhận hụi thành công!");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error("Lỗi khi chọn người nhận hụi:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý nút trả tiền hụi
  const handlePayWinner = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      await traTienHui();
      
      setSuccess("Đã trả tiền hụi cho người thắng và chuyển sang kỳ mới!");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error("Lỗi khi trả tiền hụi:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý nút trả lại tiền ký quỹ
  const handleReturnDeposits = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      await traLaiTienKyQuy();
      
      setSuccess("Đã hoàn trả tiền ký quỹ cho tất cả thành viên!");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error("Lỗi khi trả lại tiền ký quỹ:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý nút xử lý vi phạm
  const handleViolations = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      await xuLyViPham();
      
      setSuccess("Đã xử lý các vi phạm!");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error("Lỗi khi xử lý vi phạm:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!contract || !account) {
    return <p>Vui lòng kết nối ví để xem trang quản trị.</p>;
  }

  if (!isAdmin) {
    return <p>Bạn không phải là chủ hụi. Chỉ chủ hụi mới có quyền quản trị.</p>;
  }

  if (loading && !contractInfo) {
    return <p>Đang tải thông tin...</p>;
  }

  // Kiểm tra trạng thái hụi
  const isKeuHuiState = contractInfo && contractInfo.kyState === "KEU_HUI";
  const isDongTienState = contractInfo && contractInfo.kyState === "DONG_TIEN";
  const isHuiEnded = contractInfo && contractInfo.huiKetThuc;

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Trang quản trị (Chủ hụi)</Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <div className="admin-actions d-flex flex-wrap gap-2">
          {/* Nút chọn người nhận hụi - chỉ hiển thị khi đang ở trạng thái KEU_HUI */}
          {isKeuHuiState && (
            <Button 
              variant="primary" 
              onClick={handleSelectWinner}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Chọn người nhận hụi'}
            </Button>
          )}

          {/* Nút trả tiền hụi - chỉ hiển thị khi đang ở trạng thái DONG_TIEN */}
          {isDongTienState && (
            <Button 
              variant="success" 
              onClick={handlePayWinner}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Trả tiền hụi & Sang kỳ mới'}
            </Button>
          )}

          {/* Nút xử lý vi phạm - chỉ hiển thị khi đang ở trạng thái DONG_TIEN */}
          {isDongTienState && (
            <Button 
              variant="warning" 
              onClick={handleViolations}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Xử lý vi phạm'}
            </Button>
          )}

          {/* Nút trả lại tiền ký quỹ - chỉ hiển thị khi hụi đã kết thúc */}
          {isHuiEnded && (
            <Button 
              variant="info" 
              onClick={handleReturnDeposits}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Trả lại tiền ký quỹ'}
            </Button>
          )}
        </div>

        {isHuiEnded && (
          <Alert variant="info" className="mt-3">
            Hụi đã kết thúc. Bạn có thể trả lại tiền ký quỹ cho các thành viên.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default AdminPanel;