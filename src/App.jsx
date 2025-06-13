import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Web3Provider } from './contexts/Web3Context';
import ConnectWallet from './components/ConnectWallet';
import ContractInfo from './components/ContractInfo';
import MemberList from './components/MemberList';
import HuiForm from './components/HuiForm';
import AdminPanel from './components/AdminPanel';
import BiddingHistory from './components/BiddingHistory';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Container className="py-5">
        <Card className="text-center mb-4">
          <Card.Body>
            <Card.Title as="h1">Chơi Hụi Blockchain</Card.Title>
            <Card.Text>
              Ứng dụng phi tập trung (DApp) cho Smart Contract Hụi trên Blockchain
            </Card.Text>
          </Card.Body>
        </Card>

        <ConnectWallet />

        <Row className="mb-4">
          <Col md={6}>
            <ContractInfo />
          </Col>
          <Col md={6}>
            <HuiForm />
          </Col>
        </Row>

        <Row className="mb-4">
          <Col>
            <AdminPanel />
          </Col>
        </Row>

        <Row className="mb-4">
          <Col>
            <MemberList />
          </Col>
        </Row>

        <Row>
          <Col>
            <BiddingHistory />
          </Col>
        </Row>

        <footer className="text-center mt-5 py-3">
          <p>&copy; 2025 - Đồ án Blockchain - Ứng dụng Chơi Hụi</p>
        </footer>
      </Container>
    </Web3Provider>
  );
}

export default App;