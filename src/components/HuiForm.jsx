import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useWeb3 } from '../contexts/Web3Context';

const HuiForm = () => {
  const { 
    contract, 
    account,
    getContractInfo,
    getMemberInfo,
    thamGiaHui,
    keuHui,
    dongTienHui
  } = useWeb3();
  
  const [contractInfo, setContractInfo] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form states
  const [bidAmount, setBidAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const info = await getContractInfo();
        setContractInfo(info);
        
        try {
          const member = await getMemberInfo(account);
          setMemberInfo(member);
        } catch (memberErr) {
          // Người dùng có thể chưa tham gia, không hiển thị lỗi
          console.log("Người dùng chưa tham gia:", memberErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInfo();
    
    // Cập nhật thông tin mỗi 10 giây
    const intervalId = setInterval(fetchInfo, 10000);
    
    return () => clearInterval(intervalId);
  }, [contract, account, getContractInfo, getMemberInfo]);

  // Xử lý nút tham gia hụi
  const handleJoinHui = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      if (!contractInfo) throw new Error("Thông tin hợp đồng chưa được tải.");
      
      await thamGiaHui(contractInfo.tienKyQuyToiThieu);
      
      setSuccess("Tham gia hụi thành công! Bạn đã trở thành thành viên.");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error("Lỗi khi tham gia hụi:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý nút kêu hụi
  const handleBidHui = async (e) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      if (!bidAmount) throw new Error("Vui lòng nhập số tiền kêu hụi.");
      
      const bidValue = parseFloat(bidAmount);
      if (isNaN(bidValue) || bidValue <= 0) {
        throw new Error("Số tiền kêu hụi không hợp lệ.");
      }
      
      await keuHui(bidValue);
      
      setSuccess("Kêu hụi thành công!");
      setBidAmount("");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error("Lỗi khi kêu hụi:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý nút đóng tiền hụi
  const handlePayHui = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      if (!contractInfo || !memberInfo) throw new Error("Thông tin chưa được tải đầy đủ.");
      
      // Tính số tiền phải đóng dựa trên trạng thái
      let amountToPay;
      
      if (memberInfo.laHuiChet) {
        amountToPay = contractInfo.tienMotKy;
      } else {
        // Lấy thông tin người nhận hụi để biết họ kêu giá bao nhiêu
        try {
          const receiver = await getMemberInfo(contractInfo.nguoiNhanHui);
          amountToPay = (parseFloat(contractInfo.tienMotKy) - parseFloat(receiver.soTienKeuHui)).toString();
        } catch (err) {
          throw new Error("Không thể tính toán số tiền cần đóng.");
        }
      }
      
      await dongTienHui(amountToPay);
      
      setSuccess("Đóng tiền hụi thành công!");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error("Lỗi khi đóng tiền hụi:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!contract || !account) {
    return <p>Vui lòng kết nối ví để thực hiện các thao tác.</p>;
  }

  if (loading && !contractInfo) {
    return <p>Đang tải thông tin...</p>;
  }

  // Kiểm tra người dùng đã tham gia chưa
  const isNotMember = !memberInfo || memberInfo.diaChi === '0x0000000000000000000000000000000000000000';

  // Kiểm tra trạng thái hụi
  const isKeuHuiState = contractInfo && contractInfo.kyState === "KEU_HUI";
  const isDongTienState = contractInfo && contractInfo.kyState === "DONG_TIEN";
  const isHuiEnded = contractInfo && contractInfo.huiKetThuc;

  // Kiểm tra người dùng có phải là người nhận hụi không
  const isReceiver = contractInfo && 
                     contractInfo.nguoiNhanHui && 
                     contractInfo.nguoiNhanHui.toLowerCase() === account.toLowerCase();

  // Kiểm tra người dùng đã đóng tiền chưa
  const hasAlreadyPaid = memberInfo && memberInfo.daDongTienHui;

  // Kiểm tra người dùng đã hút hụi chưa
  const hasAlreadyReceived = memberInfo && memberInfo.daHutHui;

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Thao tác hụi</Card.Header>
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

        {isHuiEnded ? (
          <Alert variant="info">
            Hụi đã kết thúc. Không thể thực hiện thêm các thao tác.
          </Alert>
        ) : (
          <>
            {/* Form tham gia hụi */}
            {isNotMember && (
              <div className="mb-4">
                <h5>Tham gia hụi</h5>
                <p>
                  Để tham gia hụi, bạn cần đóng tiền ký quỹ: <strong>{contractInfo?.tienKyQuyToiThieu} ETH</strong>
                </p>
                <Button 
                  variant="primary" 
                  onClick={handleJoinHui}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Đang xử lý...' : 'Tham gia hụi'}
                </Button>
              </div>
            )}

            {/* Form kêu hụi - chỉ hiển thị khi đang ở trạng thái KEU_HUI và người dùng chưa hút hụi */}
            {!isNotMember && isKeuHuiState && !hasAlreadyReceived && (
              <div className="mb-4">
                <h5>Kêu hụi</h5>
                <Form onSubmit={handleBidHui}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số tiền kêu hụi (ETH)</Form.Label>
                    <Form.Control 
                      type="number"
                      step="0.01"
                      min="0"
                      max={contractInfo?.tienMotKy || 1}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Nhập số tiền (tối đa ${contractInfo?.tienMotKy} ETH)`}
                      disabled={isProcessing}
                      required
                    />
                    <Form.Text className="text-muted">
                      Số tiền kêu hụi phải nhỏ hơn tiền một kỳ ({contractInfo?.tienMotKy} ETH)
                    </Form.Text>
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Kêu hụi'}
                  </Button>
                </Form>
              </div>
            )}

            {/* Form đóng tiền hụi - chỉ hiển thị khi đang ở trạng thái DONG_TIEN, người dùng không phải 
                là người nhận hụi và chưa đóng tiền */}
            {!isNotMember && isDongTienState && !isReceiver && !hasAlreadyPaid && (
              <div className="mb-4">
                <h5>Đóng tiền hụi</h5>
                <p>
                  Người nhận hụi kỳ này: <strong>{contractInfo?.nguoiNhanHui}</strong>
                </p>
                <Button 
                  variant="primary" 
                  onClick={handlePayHui}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Đang xử lý...' : 'Đóng tiền hụi'}
                </Button>
              </div>
            )}

            {/* Thông báo khi người dùng là người nhận hụi */}
            {!isNotMember && isDongTienState && isReceiver && (
              <div className="mb-4">
                <Alert variant="success">
                  Bạn là người nhận hụi kỳ này. Bạn không cần đóng tiền.
                </Alert>
              </div>
            )}

            {/* Thông báo khi người dùng đã đóng tiền */}
            {!isNotMember && isDongTienState && hasAlreadyPaid && (
              <div className="mb-4">
                <Alert variant="info">
                  Bạn đã đóng tiền hụi cho kỳ này.
                </Alert>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default HuiForm;