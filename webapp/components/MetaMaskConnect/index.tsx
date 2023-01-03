import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import blockchainnet from '../../blockchainnet.json';
import MetaMaskOnboarding from '@metamask/onboarding';
import { Button, Menu } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useStyles } from './styles';
import { useEffect } from 'react';

interface MetaMaskConnectProps {
  isConnected: boolean,
  accounts: Array<string>,
  connectedBalance: string,
  handleNewAccounts(newAccounts: Array<string>): any,
  handleNewConnectedBalance(newConnectedBalance: string): any,
  handleNewIsConnected(newIsConneted: boolean): any,
}

export default function MetaMaskConnect({
  isConnected,
  accounts,
  connectedBalance,
  handleNewAccounts,
  handleNewConnectedBalance,
  handleNewIsConnected,
}: MetaMaskConnectProps) {
  const { classes, cx } = useStyles();

  const storage = globalThis?.sessionStorage;

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3(
    (Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc)
  );

  const { isMetaMaskInstalled } = MetaMaskOnboarding;

  const connectEthereum = async () => {
    const provider = await detectEthereumProvider();
    if (provider) {
      const accounts = await (provider as any).request({ method: 'eth_requestAccounts' });
    } else {
      alert("Please install MetaMask!");
    }
  };

  const checkBalance = async (address: string) => {
    const balance = await web3.eth.getBalance(address);
    return {
      address: address,
      balance: balance.toString(),
    };
  };

  const isMetaMaskConnected = () => {
    if (isConnected && !(accounts && accounts.length > 0)) {
      handleNewIsConnected(false);
      showNotification({
        title: 'Disonnected successfully',
        message: 'You have been disconnected from the Ethereum network',
        autoClose: 5000,
      })
    }
    else if (!isConnected && accounts && accounts.length > 0) {
      handleNewIsConnected(true);

      if (storage && storage.getItem('prevPath') === null) {
        showNotification({
          title: 'Connected successfully',
          message: 'You are now connected to the Ethereum network',
          autoClose: 5000,
        })
      }
    }
  }

  const getAddresses = async () => {
    if (isMetaMaskInstalled()) {
      const eth = (window.ethereum as any);

      eth.on('accountsChanged', (newAccounts: Array<string>) => {
        eth.request({
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        })
        handleNewAccounts(newAccounts);
      });

      try {
        const newAccounts = await eth.request({
          method: 'eth_accounts',
        });
        handleNewAccounts(newAccounts);
      } catch (err) {
        console.error('Error on initialisation when getting accounts', err);
      }
    }
  }

  useEffect(() => {
    getAddresses().then(() => {
      isMetaMaskConnected();
    });
  }, [])

  useEffect(() => {
    isMetaMaskConnected();
    if (accounts && accounts.length > 0)
      updateBalance();
  }, [accounts])

  const updateBalance = async () => handleNewConnectedBalance((await checkBalance(accounts[0])).balance);

  return (
    <div className={classes.wrapper}>
      {isConnected ?
        <>
          <Menu
            trigger="hover"
            withArrow
            openDelay={100}
            closeDelay={200}
            shadow="md"
          >
            <Menu.Target>
              <Button variant="outline">
                {accounts[0] !== undefined ? (accounts[0].substring(0, 5) + '...' + accounts[0].substring(38, 42)) : null}
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item icon={<img src="ethereum.svg" height="20" />}>
                {Math.round(parseInt(connectedBalance) / 10 ** 18 * 100000) / 100000} ETH
              </Menu.Item>
            </Menu.Dropdown>

          </Menu>
        </>
        :
        <Button
          onClick={connectEthereum}
          disabled={isConnected}
        >
          Connect
        </Button>
      }
    </div>
  )
}
