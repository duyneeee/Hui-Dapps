// Địa chỉ contract sau khi deploy
export const CONTRACT_ADDRESS = "0x0236284DbdBFF325eA484442d38ae43e3a4A56e4"; // Thay đổi địa chỉ này sau khi deploy contract

// Các trạng thái của contract dưới dạng enum
export const HUI_STATES = {
  0: "KEU_HUI",
  1: "DONG_TIEN",
  2: "HOAN_TAT"
};

// Mapping ngược lại để dễ sử dụng
export const HUI_STATE_IDS = {
  "KEU_HUI": 0,
  "DONG_TIEN": 1,
  "HOAN_TAT": 2
};