import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import ChoiHuiABI from '../utils/ChoiHuiABI.json';
import { CONTRACT_ADDRESS } from '../utils/constants';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Kết nối ví
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error("MetaMask không được tìm thấy. Vui lòng cài đặt MetaMask.");
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const account = await signer.getAddress();
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ChoiHuiABI,
        signer
      );
      
      // Kiểm tra xem người dùng có phải là admin không
      const chuHuiAddress = await contract.chuHui();
      const isAdmin = chuHuiAddress.toLowerCase() === account.toLowerCase();

      setProvider(provider);
      setSigner(signer);
      setNetwork(network);
      setAccount(account);
      setContract(contract);
      setIsAdmin(isAdmin);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi kết nối ví:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Lắng nghe sự thay đổi tài khoản
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        window.location.reload();
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // Các hàm tương tác với contract
  const thamGiaHui = async (value) => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      const tx = await contract.thamGiaHui({ value: ethers.utils.parseEther(value) });
      return await tx.wait();
    } catch (error) {
      console.error("Lỗi khi tham gia hụi:", error);
      throw error;
    }
  };

  const keuHui = async (bidAmount) => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      const tx = await contract.keuHui(bidAmount);
      return await tx.wait();
    } catch (error) {
      console.error("Lỗi khi kêu hụi:", error);
      throw error;
    }
  };

  const dongTienHui = async (value) => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      const tx = await contract.dongTienHui({ value: ethers.utils.parseEther(value) });
      return await tx.wait();
    } catch (error) {
      console.error("Lỗi khi đóng tiền hụi:", error);
      throw error;
    }
  };

  // Các hàm chỉ dành cho admin
  const chonNguoiNhanHui = async () => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      if (!isAdmin) throw new Error("Bạn không phải là chủ hụi.");
      const tx = await contract.chonNguoiNhanHui();
      return await tx.wait();
    } catch (error) {
      console.error("Lỗi khi chọn người nhận hụi:", error);
      throw error;
    }
  };

  const traTienHui = async () => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      if (!isAdmin) throw new Error("Bạn không phải là chủ hụi.");
      const tx = await contract.traTienHui();
      return await tx.wait();
    } catch (error) {
      console.error("Lỗi khi trả tiền hụi:", error);
      throw error;
    }
  };

  const traLaiTienKyQuy = async () => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      if (!isAdmin) throw new Error("Bạn không phải là chủ hụi.");
      const tx = await contract.traLaiTienKyQuy();
      return await tx.wait();
    } catch (error) {
      console.error("Lỗi khi trả lại tiền ký quỹ:", error);
      throw error;
    }
  };

  const xuLyViPham = async () => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      if (!isAdmin) throw new Error("Bạn không phải là chủ hụi.");
      const tx = await contract.xuLyViPham();
      return await tx.wait();
    } catch (error) {
      console.error("Lỗi khi xử lý vi phạm:", error);
      throw error;
    }
  };

  // Các hàm lấy thông tin từ contract
  const getContractInfo = async () => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      
      const chuHui = await contract.chuHui();
      const soThanhVienToiDa = await contract.soThanhVienToiDa();
      const tienMotKy = ethers.utils.formatEther(await contract.tienMotKy());
      const tongSoKy = await contract.tongSoKy();
      const kyHienTai = await contract.kyHienTai();
      const tienKyQuyToiThieu = ethers.utils.formatEther(await contract.tienKyQuyToiThieu());
      const kyState = await contract.kyState();
      const huiKetThuc = await contract.huiKetThuc();
      
      let nguoiNhanHui = await contract.nguoiNhanHui();
      let tongTienDaDong = ethers.utils.formatEther(await contract.tongTienDaDong());

      // Chuyển đổi kyState từ số sang tên trạng thái
      const stateNames = ["KEU_HUI", "DONG_TIEN", "HOAN_TAT"];
      const kyStateName = stateNames[kyState];

      return {
        chuHui,
        soThanhVienToiDa: soThanhVienToiDa.toString(),
        tienMotKy,
        tongSoKy: tongSoKy.toString(),
        kyHienTai: kyHienTai.toString(),
        tienKyQuyToiThieu,
        kyState: kyStateName,
        huiKetThuc,
        nguoiNhanHui,
        tongTienDaDong
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin hợp đồng:", error);
      throw error;
    }
  };

  // Lấy thông tin thành viên cụ thể
  const getMemberInfo = async (address) => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      
      const member = await contract.danhSachHuiVien(address);
      
      return {
        diaChi: member.diaChi,
        soLanChamDong: member.soLanChamDong.toString(),
        daHutHui: member.daHutHui,
        soTienKeuHui: ethers.utils.formatEther(member.soTienKeuHui),
        daDongTienHui: member.daDongTienHui,
        laHuiChet: member.laHuiChet,
        soTienKyQuy: ethers.utils.formatEther(member.soTienKyQuy)
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin thành viên:", error);
      throw error;
    }
  };

  // Lấy danh sách địa chỉ của tất cả người chơi
  const getMemberAddresses = async () => {
    try {
      if (!contract) throw new Error("Contract chưa được kết nối.");
      
      const playerCount = await contract.danhSachNguoiChoi.length;
      const addresses = [];
      
      for (let i = 0; i < playerCount; i++) {
        try {
          const address = await contract.danhSachNguoiChoi(i);
          addresses.push(address);
        } catch (error) {
          // Nếu địa chỉ không tồn tại, tiếp tục vòng lặp
          break;
        }
      }
      
      return addresses;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách địa chỉ thành viên:", error);
      throw error;
    }
  };

  // Lắng nghe các sự kiện từ contract
  useEffect(() => {
    if (contract) {
      // Lắng nghe sự kiện ThanhVienThamGia
      contract.on("ThanhVienThamGia", (thanhVien, tienKyQuy) => {
        console.log("Thành viên mới tham gia:", thanhVien, ethers.utils.formatEther(tienKyQuy));
        // TODO: Cập nhật UI khi có thành viên mới
      });

      // Lắng nghe sự kiện HuiVienKeuHui
      contract.on("HuiVienKeuHui", (thanhVien, soTienKeuHui) => {
        console.log("Thành viên kêu hụi:", thanhVien, ethers.utils.formatEther(soTienKeuHui));
        // TODO: Cập nhật UI khi có người kêu hụi
      });

      // Lắng nghe sự kiện ThongBaoNguoiNhanHui
      contract.on("ThongBaoNguoiNhanHui", (nguoiNhan, soTienKeuHui) => {
        console.log("Người nhận hụi:", nguoiNhan, ethers.utils.formatEther(soTienKeuHui));
        // TODO: Cập nhật UI khi có người được chọn nhận hụi
      });

      // Lắng nghe các sự kiện khác...

      return () => {
        // Cleanup listeners khi component unmount
        contract.removeAllListeners();
      };
    }
  }, [contract]);

  const value = {
    provider,
    signer,
    contract,
    account,
    network,
    loading,
    error,
    isAdmin,
    connectWallet,
    thamGiaHui,
    keuHui,
    dongTienHui,
    chonNguoiNhanHui,
    traTienHui,
    traLaiTienKyQuy,
    xuLyViPham,
    getContractInfo,
    getMemberInfo,
    getMemberAddresses
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export default Web3Context;