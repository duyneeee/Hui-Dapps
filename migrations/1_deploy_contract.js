const ChoiHui = artifacts.require("ChoiHui");

module.exports = function (deployer, network, accounts) {
  // Các tham số cho constructor:
  // 1. Số thành viên tối đa (ví dụ: 5)
  // 2. Tiền mỗi kỳ (ví dụ: 1 ETH)
  deployer.deploy(ChoiHui, 3, 6);
};