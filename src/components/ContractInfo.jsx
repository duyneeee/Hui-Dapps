import React from 'react';
import { Button } from 'react-bootstrap';
import { useWeb3 } from '../contexts/Web3Context';

const ConnectWallet = () => {
  const { connectWallet, account, loading, error } = useWeb3();

  return (
    <div className="connect-wallet-container mb-4 p-3 border rounded">
      {!account ? (
        <div className="text-center">
          <Button 
            variant="primary" 
            onClick={connectWallet} 
            disabled={loading}
          >
            {loading ? 'Đang kết nối...' : 'Kết nối ví MetaMask'}
          </Button>
          {error && <p className="text-danger mt-2">{error}</p>}
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-0">
            <strong>Địa chỉ ví đã kết nối:</strong>
          </p>
          <p className="mb-0 text-truncate">
            {account}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;