// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ChoiHui
 * Hợp đồng mô phỏng chơi hụi với logic:
 *  - Tham gia + ký quỹ
 *  - Kêu hụi (bid)
 *  - Chọn người nhận hụi
 *  - Đóng tiền hụi, trả hụi
 *  - Xử lý vi phạm & hoàn trả ký quỹ
 */
contract ChoiHui {
    // Xác định các trạng thái chính của một KỲ hụi (state machine)
    enum KyState {
        KEU_HUI,      // Chờ mọi người kêu hụi
        DONG_TIEN,    // Đang đóng tiền cho người thắng
        HOAN_TAT      // Hoàn tất kỳ
    }

    struct ThanhVien {
        address payable diaChi;
        uint256 soLanChamDong;
        bool daHutHui;
        uint256 soTienKeuHui;
        bool daDongTienHui;
        bool laHuiChet;
        // BỔ SUNG: Lưu lại tiền ký quỹ thực sự mà thành viên đã nộp
        uint256 soTienKyQuy;
    }

    address public chuHui;
    uint256 public soThanhVienToiDa;
    uint256 public tienMotKy;         // Đơn vị: ETH
    uint256 public tongSoKy;
    uint256 public kyHienTai;
    uint256 public tienKyQuyToiThieu; // Đơn vị: ETH

    address public nguoiNhanHui;
    uint256 public tongTienDaDong;

    // Đánh dấu khi đã kết thúc hết các kỳ
    bool public huiKetThuc;

    // Đánh dấu kỳ đã đóng xong
    // key: kỳ (1..tongSoKy), value: đã đóng xong?
    mapping(uint256 => bool) public kyDaDongXong;

    // BỔ SUNG: Trạng thái kỳ hiện tại (state machine cho từng kỳ)
    KyState public kyState;

    // Danh sách thành viên
    mapping(address => ThanhVien) public danhSachHuiVien;
    address[] public danhSachNguoiChoi;

    // Sự kiện
    event ThanhVienThamGia(address thanhVien, uint256 tienKyQuy);
    event HuiVienKeuHui(address thanhVien, uint256 soTienKeuHui);
    event HuiVienHutHui(address thanhVien, uint256 soTien);
    event BiLoaiKhoiHui(address thanhVien);
    event DongTienHui(address thanhVien, uint256 soTien);
    event TraTienHui(address thanhVien, uint256 soTien);

    // BỔ SUNG: Sự kiện khi trả lại tiền ký quỹ
    event KyQuyDuocTra(address thanhVien, uint256 soTien);

    // Sự kiện vi phạm cụ thể
    event ViPhamDongTien(address thanhVien, string lyDo);

    // Khi chủ hụi đã chọn xong người nhận, thông báo ai nhận
    event ThongBaoNguoiNhanHui(address nguoiNhan, uint256 soTienKeuHui);

    modifier chiChuHui() {
        require(msg.sender == chuHui, "Chi co chu hui moi co quyen!");
        _;
    }

    modifier chiThanhVien() {
        require(danhSachHuiVien[msg.sender].diaChi != address(0), "Ban khong phai thanh vien!");
        _;
    }

    constructor(uint256 _soThanhVienToiDa, uint256 _tienMotKy) {
        chuHui = msg.sender;
        soThanhVienToiDa = _soThanhVienToiDa;
        tienMotKy = _tienMotKy * 1 ether;           // Chuyển đổi sang đơn vị ETH
        tienKyQuyToiThieu = _tienMotKy / 2 * 1 ether; // Tiền ký quỹ bằng 50% số tiền một kỳ
        tongSoKy = _soThanhVienToiDa;
        kyHienTai = 1;
        huiKetThuc = false;

        // BẮT ĐẦU KỲ 1: Ở trạng thái KEU_HUI
        kyState = KyState.KEU_HUI;
    }

    // ===========================
    // 1) Tham gia hụi
    // ===========================
    function thamGiaHui() public payable {
        require(!huiKetThuc, "Hui da ket thuc, khong the tham gia!");
        require(danhSachNguoiChoi.length < soThanhVienToiDa, "Hui da day thanh vien!");
        require(msg.value == tienKyQuyToiThieu, "So tien gui vao khong dung voi quy dinh ky quy!");
        require(danhSachHuiVien[msg.sender].diaChi == address(0), "Ban da la thanh vien!");

        danhSachHuiVien[msg.sender] = ThanhVien({
            diaChi: payable(msg.sender),
            soLanChamDong: 0,
            daHutHui: false,
            soTienKeuHui: 0,
            daDongTienHui: false,
            laHuiChet: false,
            soTienKyQuy: msg.value
        });
        danhSachNguoiChoi.push(msg.sender);

        emit ThanhVienThamGia(msg.sender, msg.value);
    }

    // ===========================
    // 2) Kêu hụi
    // ===========================
    function keuHui(uint256 bidAmount) public chiThanhVien {
        require(!huiKetThuc, "Hui da ket thuc!");
        require(kyState == KyState.KEU_HUI, "Khong the keu hui luc nay!");
        require(!danhSachHuiVien[msg.sender].daHutHui, "Ban da hut hui, khong the keu lai!");
        require(kyHienTai <= tongSoKy, "Hui da ket thuc!");
        require(bidAmount * 1 ether < tienMotKy, "So tien keu hui phai nho hon tien mot ky (dang la ...)!");

        // NOTE: If bidAmount == 0 => kêu 0, logic tuỳ policy
        danhSachHuiVien[msg.sender].soTienKeuHui = bidAmount * 1 ether;
        emit HuiVienKeuHui(msg.sender, bidAmount * 1 ether);
    }

    // ===========================
    // 3) Chọn người nhận hụi
    // ===========================
    function chonNguoiNhanHui() public chiChuHui {
        require(!huiKetThuc, "Hui da ket thuc!");
        require(kyState == KyState.KEU_HUI, "Chua den luc chon nguoi hut hui!");
        require(nguoiNhanHui == address(0), "Nguoi nhan hui da duoc chon!");

        // Tìm maxBid
        uint256 maxBid = 0;
        address lastMember;
        uint256 countHuiChet = 0;
        for (uint256 i = 0; i < danhSachNguoiChoi.length; i++) {
            address _nguoiChoi = danhSachNguoiChoi[i];
            if (danhSachHuiVien[_nguoiChoi].daHutHui) {
                countHuiChet++;
            } else {
                // Ghi nhớ ai là người chưa nhận
                lastMember = _nguoiChoi;
            }
            if (
                !danhSachHuiVien[_nguoiChoi].daHutHui &&
                danhSachHuiVien[_nguoiChoi].soTienKeuHui > maxBid
            ) {
                maxBid = danhSachHuiVien[_nguoiChoi].soTienKeuHui;
                nguoiNhanHui = _nguoiChoi;
            }
        }

        // Trường hợp chỉ còn 1 người chưa nhận => auto
        if (countHuiChet == soThanhVienToiDa - 1) {
            nguoiNhanHui = lastMember;
        }

        emit ThongBaoNguoiNhanHui(nguoiNhanHui, danhSachHuiVien[nguoiNhanHui].soTienKeuHui);

        // Chuyển sang trạng thái DONG_TIEN
        kyState = KyState.DONG_TIEN;
    }

    // ===========================
    // 4) Đóng tiền hụi
    // ===========================
    function dongTienHui() public payable chiThanhVien {
        require(!huiKetThuc, "Hui da ket thuc!");
        require(kyState == KyState.DONG_TIEN, "Khong the dong tien luc nay!");
        require(nguoiNhanHui != address(0), "Chua chon nguoi nhan hui!");
        require(!danhSachHuiVien[msg.sender].daDongTienHui, "Ban da dong tien ky nay!");
        require(msg.sender != nguoiNhanHui, "Nguoi nhan hui khong can dong tien!");

        uint256 soTienDong = danhSachHuiVien[msg.sender].laHuiChet
            ? tienMotKy
            : (tienMotKy - danhSachHuiVien[nguoiNhanHui].soTienKeuHui);

        require(
            msg.value == soTienDong,
            "Sai so tien can dong! Vui long kiem tra 'tienMotKy' hoac 'soTienKeuHui'."
        );

        danhSachHuiVien[msg.sender].daDongTienHui = true;
        tongTienDaDong += msg.value;
        emit DongTienHui(msg.sender, msg.value);
    }

    // ===========================
    // 5) Trả tiền hụi + qua kỳ mới
    // ===========================
    function traTienHui() public chiChuHui {
        require(!huiKetThuc, "Hui da ket thuc!");
        require(kyState == KyState.DONG_TIEN, "Khong the tra tien luc nay!");
        require(nguoiNhanHui != address(0), "Chua co nguoi nhan hui!");

        // Kiểm tra tất cả người còn lại đã dongTienHui?
        for (uint256 i = 0; i < danhSachNguoiChoi.length; i++) {
            address _nguoiChoi = danhSachNguoiChoi[i];
            if (_nguoiChoi != nguoiNhanHui && danhSachHuiVien[_nguoiChoi].diaChi != address(0)) {
                require(
                    danhSachHuiVien[_nguoiChoi].daDongTienHui,
                    "Van co nguoi chua dong tien hui!"
                );
            }
        }

        // Tính tổng tiền cần đóng
        uint256 tongTienCanDong = 0;
        for (uint256 i = 0; i < danhSachNguoiChoi.length; i++) {
            address player = danhSachNguoiChoi[i];
            if (player != nguoiNhanHui && danhSachHuiVien[player].diaChi != address(0)) {
                if (danhSachHuiVien[player].laHuiChet) {
                    tongTienCanDong += tienMotKy;
                } else {
                    tongTienCanDong += (tienMotKy - danhSachHuiVien[nguoiNhanHui].soTienKeuHui);
                }
            }
        }
        require(
            tongTienDaDong == tongTienCanDong,
            "Chua du tien de tra! Co the co nguoi chua dong hoac vi pham."
        );

        // Trả tiền cho nguoiNhanHui
        payable(nguoiNhanHui).transfer(tongTienDaDong);
        danhSachHuiVien[nguoiNhanHui].daHutHui = true;
        danhSachHuiVien[nguoiNhanHui].laHuiChet = true;

        emit TraTienHui(nguoiNhanHui, tongTienDaDong);

        // Đánh dấu kỳ đã đóng xong
        kyDaDongXong[kyHienTai] = true;

        // Reset kỳ
        nguoiNhanHui = address(0);
        tongTienDaDong = 0;

        for (uint256 j = 0; j < danhSachNguoiChoi.length; j++) {
            danhSachHuiVien[danhSachNguoiChoi[j]].daDongTienHui = false;
        }
        kyHienTai++;

        // Nếu đã qua kỳ cuối => đánh dấu kết thúc
        if (kyHienTai > tongSoKy) {
            huiKetThuc = true;
            kyState = KyState.HOAN_TAT;
        } else {
            // Sang kỳ mới => về state KEU_HUI
            kyState = KyState.KEU_HUI;
        }
    }

    // ===========================
    // 6) Trả lại tiền ký quỹ (chỉ gọi khi thật sự kết thúc)
    // ===========================
    function traLaiTienKyQuy() public chiChuHui {
        require(huiKetThuc, "Hui chua ket thuc, khong the tra ky quy!");
        // Tùy policy: chỉ được gọi 1 lần, có thể set cờ chặn

        for (uint256 i = 0; i < danhSachNguoiChoi.length; i++) {
            address thanhVien = danhSachNguoiChoi[i];
            // Nếu còn địa chỉ hợp lệ
            if (danhSachHuiVien[thanhVien].diaChi != address(0)) {
                uint256 deposit = danhSachHuiVien[thanhVien].soTienKyQuy;
                if (deposit > 0) {
                    payable(thanhVien).transfer(deposit);
                    danhSachHuiVien[thanhVien].soTienKyQuy = 0;
                    emit KyQuyDuocTra(thanhVien, deposit);
                }
            }
        }
    }

    // ===========================
    // 7) Xử lý vi phạm
    // ===========================
    function xuLyViPham() public chiChuHui {
        // Duyệt xem ai chưa dongTienHui => vi phạm
        // Hoặc tuỳ policy: check deadline, check “chưa keuHui”...
        for (uint256 i = 0; i < danhSachNguoiChoi.length; i++) {
            address violator = danhSachNguoiChoi[i];
            if (
                !danhSachHuiVien[violator].daDongTienHui &&
                danhSachHuiVien[violator].diaChi != address(0) &&
                !danhSachHuiVien[violator].daHutHui
            ) {
                // Tịch thu ký quỹ
                uint256 deposit = danhSachHuiVien[violator].soTienKyQuy;
                if (deposit > 0) {
                    tongTienDaDong += deposit; // Bù vào quỹ
                    danhSachHuiVien[violator].soTienKyQuy = 0;
                }
                // Loại
                danhSachHuiVien[violator].diaChi = payable(address(0));

                emit BiLoaiKhoiHui(violator);
                emit ViPhamDongTien(violator, "Khong dong tien hui dung han (Vi pham)");
            }
        }
    }
}
