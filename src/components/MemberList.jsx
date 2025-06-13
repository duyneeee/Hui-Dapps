import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { useWeb3 } from '../contexts/Web3Context';

const MemberList = () => {
  const { contract, account, getMemberAddresses, getMemberInfo } = useWeb3();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!contract || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Lấy danh sách địa chỉ thành viên
        const addresses = await getMemberAddresses();
        
        // Lấy thông tin chi tiết của từng thành viên
        const memberInfoPromises = addresses.map(address => 
          getMemberInfo(address).then(info => ({
            address,
            ...info
          }))
        );
        
        const membersInfo = await Promise.all(memberInfoPromises);
        
        // Lọc ra những thành viên có địa chỉ hợp lệ
        const validMembers = membersInfo.filter(
          member => member.diaChi !== '0x0000000000000000000000000000000000000000'
        );
        
        setMembers(validMembers);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách thành viên:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMembers();
    
    // Cập nhật danh sách thành viên mỗi 10 giây
    const intervalId = setInterval(fetchMembers, 10000);
    
    return () => clearInterval(intervalId);
  }, [contract, account, getMemberAddresses, getMemberInfo]);

  if (!contract || !account) {
    return <p>Vui lòng kết nối ví để xem danh sách thành viên.</p>;
  }

  if (loading && members.length === 0) {
    return <p>Đang tải danh sách thành viên...</p>;
  }

  if (error) {
    return <p className="text-danger">Lỗi: {error}</p>;
  }

  return (
    <div className="member-list-container mb-4">
      <h3>Danh sách thành viên ({members.length})</h3>
      {members.length === 0 ? (
        <p>Chưa có thành viên nào tham gia.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Địa chỉ</th>
              <th>Đã hút hụi</th>
              <th>Tiền ký quỹ (ETH)</th>
              <th>Là hụi chết</th>
              <th>Đã đóng tiền</th>
              <th>Tiền kêu hụi (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={index} className={member.address === account ? 'table-primary' : ''}>
                <td>
                  {member.address === account ? (
                    <strong>{member.address} (Bạn)</strong>
                  ) : (
                    member.address
                  )}
                </td>
                <td>{member.daHutHui ? 'Đã hút' : 'Chưa hút'}</td>
                <td>{member.soTienKyQuy}</td>
                <td>{member.laHuiChet ? 'Có' : 'Không'}</td>
                <td>{member.daDongTienHui ? 'Đã đóng' : 'Chưa đóng'}</td>
                <td>
                  {parseFloat(member.soTienKeuHui) > 0 
                    ? member.soTienKeuHui 
                    : 'Chưa kêu hụi'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default MemberList;