import { useStyles } from './styles';
import AmountInput from '../AmountInput';
import CollapsibleArea from '../CollapsibleArea';
import { useState } from 'react';
import { IconX, IconCheck } from '@tabler/icons';
import { Button } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';

interface TopUpProps {
  betId: string,
  secretBet: boolean,
}

export default function TopUp({ betId, secretBet }: TopUpProps) {
  const { classes, cx } = useStyles();

  const [topUpValue, setTopUpValue] = useState<number>();
  // const [betId, setBetId] = useState<any>('');

  const [betValueError, setBetValueError] = useState('');
  // const [betIdError, setBetIdError] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetNumber = new web3.eth.Contract(contracts.BetNumber.abi as unknown as AbiItem, contracts.BetNumber.address);
  const BetNumberSecretAnswer = new web3.eth.Contract(contracts.BetNumberSecretAnswer.abi as unknown as AbiItem, contracts.BetNumberSecretAnswer.address);

  const handleNewBetValue = (newBetValue: number) => setTopUpValue(newBetValue);

  const handleTopUp = () => {
    setBetValueError('');
    // setBetIdError('');

    if (topUpValue === 0)
      setBetValueError('Bet value must be greater than 0');
    if (topUpValue === undefined || topUpValue === null)
      setBetValueError('Bet value must be defined');
    // if (betId === '')
    //   setBetIdError('Bet ID must be defined');

    if (topUpValue !== 0 &&
      topUpValue !== undefined &&
      betId !== '') {
      topUp();
    }
  }

  const topUp = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);
      if (!secretBet){
        BetNumber.methods.topUp(betId)
          .estimateGas({ from: provider.selectedAddress, value: topUpValue }, async function (error: any) {
            if (error === null) {
              const count = await web3.eth.getTransactionCount(provider.selectedAddress);
              console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

              try {
                await provider.request({
                  method: 'eth_sendTransaction',
                  params: [{
                    from: provider.selectedAddress,
                    to: contracts.BetNumber.address,
                    value: topUpValue?.toString(16),
                    data: web3.eth.abi.encodeFunctionCall({
                      name: 'topUp',
                      type: 'function',
                      inputs: [{
                        name: 'betId',
                        type: 'string',
                      }],
                    }, [betId]),
                    chainId: 31337,
                  },],
                });
                showNotification({
                  autoClose: 10000,
                  title: "Your bet has been topped up successfully",
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
        BetNumberSecretAnswer.methods.topUp(betId)
          .estimateGas({ from: provider.selectedAddress, value: topUpValue }, async function (error: any) {
            if (error === null) {
              const count = await web3.eth.getTransactionCount(provider.selectedAddress);
              console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

              try {
                await provider.request({
                  method: 'eth_sendTransaction',
                  params: [{
                    from: provider.selectedAddress,
                    to: contracts.BetNumberSecretAnswer.address,
                    value: topUpValue?.toString(16),
                    data: web3.eth.abi.encodeFunctionCall({
                      name: 'topUp',
                      type: 'function',
                      inputs: [{
                        name: 'betId',
                        type: 'string',
                      }],
                    }, [betId]),
                    chainId: 31337,
                  },],
                });
                showNotification({
                  autoClose: 10000,
                  title: "Your bet has been topped up successfully",
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
    <CollapsibleArea title="Top Up">
      <AmountInput
        betValueError={betValueError}
        label="Top up value"
        handleNewBetValue={handleNewBetValue}
      />

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

      <Button
        variant="subtle"
        onClick={handleTopUp}
      >
        Top up
      </Button>
    </CollapsibleArea>
  )
}
