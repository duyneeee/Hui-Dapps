import React, { useState, useEffect } from 'react';
import { Table, Card } from 'react-bootstrap';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const BiddingHistory = () => {
  const { contract, account } = useWeb3();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Lấy tất cả các sự kiện hỗ trợ từ block 0 đến hiện tại
        const blockNumber = await contract.provider.getBlockNumber();
        
        // ThanhVienThamGia events
        const joinEvents = await contract.queryFilter(
          contract.filters.ThanhVienThamGia(),
          0,
          blockNumber
        );
        
        // HuiVienKeuHui events
        const bidEvents = await contract.queryFilter(
          contract.filters.HuiVienKeuHui(),
          0,
          blockNumber
        );
        
        // ThongBaoNguoiNhanHui events
        const winnerEvents = await contract.queryFilter(
          contract.filters.ThongBaoNguoiNhanHui(),
          0,
          blockNumber
        );
        
        // TraTienHui events
        const payoutEvents = await contract.queryFilter(
          contract.filters.TraTienHui(),
          0,
          blockNumber
        );
        
        // Format events to include type, block number, and timestamp
        const formatEvents = async (eventList, eventType) => {
          return Promise.all(
            eventList.map(async (event) => {
              const block = await contract.provider.getBlock(event.blockNumber);
              return {
                type: eventType,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                timestamp: block ? new Date(block.timestamp * 1000) : null,
                ...event.args
              };
            })
          );
        };
        
        const formattedJoinEvents = await formatEvents(joinEvents, "JOIN");
        const formattedBidEvents = await formatEvents(bidEvents, "BID");
        const formattedWinnerEvents = await formatEvents(winnerEvents, "WINNER");
        const formattedPayoutEvents = await formatEvents(payoutEvents, "PAYOUT");
        
        // Combine and sort all events by block number
        const allEvents = [
          ...formattedJoinEvents,
          ...formattedBidEvents,
          ...formattedWinnerEvents,
          ...formattedPayoutEvents,
        ].sort((a, b) => b.blockNumber - a.blockNumber); // Newest first
        
        setEvents(allEvents);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy lịch sử sự kiện:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [contract, account]);

  if (!contract || !account) {
    return <p>Vui lòng kết nối ví để xem lịch sử đấu giá.</p>;
  }

  if (loading && events.length === 0) {
    return <p>Đang tải lịch sử đấu giá...</p>;
  }

  if (error) {
    return <p className="text-danger">Lỗi: {error}</p>;
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return timestamp.toLocaleString();
  };

  const formatEth = (value) => {
    if (!value) return "0";
    return ethers.utils.formatEther(value);
  };

  const renderEventDetails = (event) => {
    switch (event.type) {
      case "JOIN":
        return (
          <>
            <td>Tham gia hụi</td>
            <td>{formatTimestamp(event.timestamp)}</td>
            <td>{event.thanhVien}</td>
            <td>{formatEth(event.tienKyQuy)} ETH</td>
            <td>-</td>
          </>
        );
      case "BID":
        return (
          <>
            <td>Kêu hụi</td>
            <td>{formatTimestamp(event.timestamp)}</td>
            <td>{event.thanhVien}</td>
            <td>{formatEth(event.soTienKeuHui)} ETH</td>
            <td>-</td>
          </>
        );
      case "WINNER":
        return (
          <>
            <td>Nhận hụi</td>
            <td>{formatTimestamp(event.timestamp)}</td>
            <td>{event.nguoiNhan}</td>
            <td>{formatEth(event.soTienKeuHui)} ETH</td>
            <td>Giá thắng</td>
          </>
        );
      case "PAYOUT":
        return (
          <>
            <td>Trả tiền hụi</td>
            <td>{formatTimestamp(event.timestamp)}</td>
            <td>{event.thanhVien}</td>
            <td>{formatEth(event.soTien)} ETH</td>
            <td>Tiền nhận</td>
          </>
        );
      default:
        return (
          <>
            <td>Sự kiện khác</td>
            <td>{formatTimestamp(event.timestamp)}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
          </>
        );
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Lịch sử hoạt động</Card.Header>
      <Card.Body>
        {events.length === 0 ? (
          <p>Chưa có hoạt động nào.</p>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Loại</th>
                <th>Thời gian</th>
                <th>Địa chỉ</th>
                <th>Số tiền (ETH)</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={index}>
                  {renderEventDetails(event)}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default BiddingHistory;