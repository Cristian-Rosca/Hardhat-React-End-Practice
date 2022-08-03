import { useState, useEffect } from 'react' // import react
import { ethers } from 'ethers' // import ethers
import Lock from './artifacts/contracts/Lock.sol/Lock.json'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Form } from 'react-bootstrap'
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';


function App() {

  const [lockedAmount, setLockedAmount] = useState()
  const [timeToUnlock, setTimeToUnlock] = useState()
  const [depositValue, setDepositValue] = useState()
  const [deposits, setDeposits] = useState([])

  class Deposit {
    constructor(address, depositAmount) {
      this.address = address;
      this.depositAmount = depositAmount;
    }
  }

  const depositsArray = []


  // contract address
  const contractAddress = "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2"

  // request account helper function 
  async function requestAccount() { // helper function 
    await window.ethereum.request({ method: 'eth_requestAccounts' }) // requests the ethereum accounts 
  }

  const handleDepositChange = (e) => {
    setDepositValue(e.target.value)
  }

  const handleDepositSubmit = async (e) => {
    if (depositValue >= 1) {
      e.preventDefault();
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, Lock.abi, signer)
      const ethValue = ethers.utils.parseEther(depositValue) // deposit value had to be stored in the state, I was trying to pass it as form value
      const deposit = await contract.deposit({ value: ethValue }); // use parseEther when depositing or sending
      await deposit.wait();
      fetchDepositEvents();
      const balance = await provider.getBalance(contractAddress);
      console.log(`deposited: ${ethers.utils.formatEther(ethValue)} ETH`);
      setLockedAmount(ethers.utils.formatEther(balance));
    }
    else {
      alert('minimum deposit 1 ETH')
    }
  }


  // update the time to unlock every
  const SECOND_MS = 1000;

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTimeToUnlock()
    }, SECOND_MS);

    return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [])


  // fetchContractBalance on render
  useEffect(() => {
    fetchContractBalance()
    fetchTimeToUnlock()
  }, [])


  // console.log the address and amount of depositors 
  async function fetchDepositEvents() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, Lock.abi, provider)
    contract.on("DepositEvent", (_sender, _value) => {
      console.log('Sender:', _sender, 'Value:', ethers.utils.formatEther(_value).toString(), 'ETH');
      console.log(depositsArray);
      const latestDeposit = new Deposit(_sender, ethers.utils.formatEther(_value))
      depositsArray.push(latestDeposit);
      setDeposits(depositsArray);
    })
  }


  async function fetchContractBalance() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    try {
      const contractBalance = await provider.getBalance(contractAddress)
      const ethBalance = ethers.utils.formatEther(contractBalance)
      setLockedAmount(ethBalance)
      console.log('contract balance', ethBalance);

    }
    catch (err) {
      console.log('error' + err);
    }
  }


  async function fetchTimeToUnlock() {
    // get the unlock time in seconds 
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, Lock.abi, provider)
    const unlockTime = await contract.unlockTime()

    // get current time in seconds
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);

    // get the difference between unlock time and current timestamp 
    const secondsToUnlock = unlockTime - currentTimestampInSeconds

    // convert timeToUnlock to hh:mm:ss
    const convertedTimeToUnlock = secondsToDhms(secondsToUnlock)
    setTimeToUnlock(convertedTimeToUnlock)
  }

  function secondsToDhms(seconds) { // converter helper function 
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
  }

  // withdrawButtonHandler
  const handleWithdrawClick = async () => {
    console.log('withdraw clicked');
    withdraw();
  }

  // withdraw function 
  async function withdraw() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      try {
        await requestAccount();
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, Lock.abi, signer)
        const withdraw = await contract.withdraw()
        withdraw.wait()
        console.log('withdraw completed');
        checkWithdrawalEvents()
        setLockedAmount(0);
      }
      catch (err) {
        console.log('error' + err);
      }
    }
  }

  // display the amount and time of withdrawal 
  async function checkWithdrawalEvents() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, Lock.abi, provider)
    contract.on("Withdrawal", (amount, when) => {
      console.log('Amount:', ethers.utils.formatEther(amount).toString(), 'When:', Date(when * 1000).toString());

    })
  }


  return (
    <div>
      <h1 style={{ display: 'flex', justifyContent: 'center' }} className='m-2'>Ethereum Vault</h1>
      <Container>
        <Row>
          <Col className='text-center'><h2>Contract Balance: {lockedAmount} ETH </h2></Col>
        </Row>

        <Row>
          <Col>
            <Form onSubmit={handleDepositSubmit} className='text-center'>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Enter deposit amount below</Form.Label>
                <Form.Control type="number" placeholder="Minimum deposit 1 ETH" onChange={handleDepositChange} value={depositValue} />
                <Form.Text className="text-muted">
                  You must deposit to view other depositors
                </Form.Text>
              </Form.Group>
              <Button variant="primary" type="submit" className="mb-4" >
                Deposit
              </Button>
            </Form>
          </Col>
        </Row>

        <Row>
          <Col className='text-center'><h2>Time to unlock: {timeToUnlock}</h2></Col>
        </Row>

        <Row>
          <Col className='text-center'>
            <Button onClick={handleWithdrawClick} variant="success" className="mt-3 mb-3">
              Withdraw
            </Button>
          </Col>
        </Row>

        <Row className='mt-3 text-center'>
          <h2>Additional Contributors</h2>
          <Col>
            <Table striped bordered hover >
              <thead>
                <tr>
                  <td>Address</td>
                  <td>Amount</td>
                </tr>
              </thead>
              <tbody>
                {
                  deposits.map((deposit, index) =>
                    <tr key={index}>
                      <td>{deposit.address}</td>
                      <td>{deposit.depositAmount}</td>
                    </tr>
                  )
                }
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </ div>

  );
}

export default App;
