import { useStyles } from './styles';
import CollapsibleArea from '../CollapsibleArea';
import { useState } from 'react';
import { IconX, IconCheck, IconUserCheck } from '@tabler/icons';
import { TextInput, Button } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';

interface WhitelistAddressProps {
  betId: string,
  secretBet: boolean,
}

export default function WhitelistAddress({ betId, secretBet }: WhitelistAddressProps) {
  const { classes, cx } = useStyles();

  // const [betId, setBetId] = useState<any>('');
  const [guesser, setGuesser] = useState<any>('');
  
  // const [betIdError, setBetIdError] = useState('');
  const [guesserError, setGuesserError] = useState('');
  
  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;
  
  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);

  const handleWhitelistAddress = async () => {
    // setBetIdError('');
    setGuesserError('');

    // if (betId === '')
    //   setBetIdError('Bet ID must be defined');
    if (guesser === '')
      setGuesserError('Address must be defined');

    if (betId !== '' &&
      guesser !== '') {
      whitelistAddress();
    }
  }

  const whitelistAddress = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      if (!secretBet){
        BetNumber.methods.whitelistAddress(betId, guesser)
          .estimateGas({ from: provider.selectedAddress, value: 0 }, async function (error: any) {
            if (error === null) {
              const count = await web3.eth.getTransactionCount(provider.selectedAddress);
              console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

              try {
                await provider.request({
                  method: 'eth_sendTransaction',
                  params: [{
                    from: provider.selectedAddress,
                    to: contracts.BetNumber.address,
                    value: (0).toString(16),
                    data: web3.eth.abi.encodeFunctionCall({
                      name: 'whitelistAddress',
                      type: 'function',
                      inputs: [{
                        name: 'betId',
                        type: 'string',
                      }, {
                        name: 'guesser',
                        type: 'address',
                      }],
                    }, [betId, guesser]),
                    chainId: 31337,
                  },],
                });
                showNotification({
                  autoClose: 10000,
                  title: "The address has been whitelisted successfully",
                  message: null,
                  color: 'teal',
                  icon: <IconCheck />
                });

                return true;
              } catch {
                return false;
              }
            } else {
              showNotification({
                autoClose: 10000,
                title: "Operation unsuccessful",
                message: String(error).split('\'')[1],
                color: 'red',
                icon: <IconX />
              });
            }
          });
      } else {
        BetNumberSecretAnswer.methods.whitelistAddress(betId, guesser)
          .estimateGas({ from: provider.selectedAddress, value: 0 }, async function (error: any) {
            if (error === null) {
              const count = await web3.eth.getTransactionCount(provider.selectedAddress);
              console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

              try {
                await provider.request({
                  method: 'eth_sendTransaction',
                  params: [{
                    from: provider.selectedAddress,
                    to: contracts.BetNumberSecretAnswer.address,
                    value: (0).toString(16),
                    data: web3.eth.abi.encodeFunctionCall({
                      name: 'whitelistAddress',
                      type: 'function',
                      inputs: [{
                        name: 'betId',
                        type: 'string',
                      }, {
                        name: 'guesser',
                        type: 'address',
                      }],
                    }, [betId, guesser]),
                    chainId: 31337,
                  },],
                });
                showNotification({
                  autoClose: 10000,
                  title: "The address has been whitelisted successfully",
                  message: null,
                  color: 'teal',
                  icon: <IconCheck />
                });

                return true;
              } catch {
                return false;
              }
            } else {
              showNotification({
                autoClose: 10000,
                title: "Operation unsuccessful",
                message: String(error).split('\'')[1],
                color: 'red',
                icon: <IconX />
              });
            }
          });
      }
    } else {
      console.log("Please install MetaMask!");
    }
  }

  return (
    <CollapsibleArea title="Whitelist Address">
      {/* <TextInput
        value={betId}
        onChange={(event) => setBetId(event.currentTarget.value)}
        placeholder="Enter ID"
        label="Bet ID"
        icon={<IconId size={16} />}
        error={betIdError ? betIdError : false}
        styles={() => ({
          root: {
            width: '100%',
          },
        })}
      /> */}

      <TextInput
        value={guesser}
        onChange={(event) => setGuesser(event.currentTarget.value)}
        placeholder="Enter address"
        label="Address"
        icon={<IconUserCheck size={16} />}
        error={guesserError ? guesserError : false}
        styles={() => ({
          root: {
            width: '100%',
          },
        })}
      />

      <Button
        variant="subtle"
        onClick={handleWhitelistAddress}
      >
        Whitelist address
      </Button>
    </CollapsibleArea>
  )
}
