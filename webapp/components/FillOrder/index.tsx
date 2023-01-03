import { useStyles } from './styles';
import { useState } from 'react';
import { IconX, IconCheck, IconChevronDown } from '@tabler/icons';
import { Button, Select, Text, NumberInput } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';

interface FillOrderProps {
  betId: string;
  orderId: number;
  amountOTM: number;
  amountWei: number;
  type: string;
}

export default function FillOrder({ betId, orderId, amountOTM, amountWei, type }: FillOrderProps) {
  const { classes, cx } = useStyles();

  const [inputAmountOTM, setInputAmountOTM] = useState<number>();

  const [amountOTMError, setAmountOTMError] = useState('');
  const [amountWeiError, setAmountWeiError] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetMarket = new web3.eth.Contract(contracts.BetMarket.abi as unknown as AbiItem, contracts.BetMarket.address);

  const handleFillOrder = () => {
    setAmountOTMError('');
    setAmountWeiError('');

    if (inputAmountOTM === undefined) {
      setAmountOTMError('OTM amount must be defined');
      setAmountWeiError('Wei amount must be defined');
    }

    if (inputAmountOTM !== undefined) {
      fillOrder();
    }
  }

  const fillOrder = async () => {
    const provider = (await detectEthereumProvider()) as any;

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      if (type == 'Buy') {
        BetMarket.methods.fillBuyOrder(betId, orderId, Math.round(inputAmountOTM!))
          .estimateGas({ from: provider.selectedAddress, value: 0 }, async function (error: any) {
            if (error === null) {
              const count = await web3.eth.getTransactionCount(provider.selectedAddress);
              console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

              try {
                await provider.request({
                  method: 'eth_sendTransaction',
                  params: [{
                    from: provider.selectedAddress,
                    to: contracts.BetMarket.address,
                    value: (0).toString(16),
                    data: web3.eth.abi.encodeFunctionCall({
                      name: 'fillBuyOrder',
                      type: 'function',
                      inputs: [{
                        name: 'betId',
                        type: 'string',
                      }, {
                        name: 'orderId',
                        type: 'uint256',
                      }, {
                        name: 'amountOTM',
                        type: 'uint256',
                      }],
                    }, [betId, orderId.toString(), Math.round(inputAmountOTM!).toString()]),
                    chainId: 31337,
                  },],
                });
                showNotification({
                  autoClose: 10000,
                  title: "The order has been filled successfully",
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
      } else if (type == 'Sell') {
        BetMarket.methods.fillSellOrder(betId, orderId)
          .estimateGas({ from: provider.selectedAddress, value: Math.round(inputAmountOTM! * amountWei / amountOTM) }, async function (error: any) {
            if (error === null) {
              const count = await web3.eth.getTransactionCount(provider.selectedAddress);
              console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

              try {
                await provider.request({
                  method: 'eth_sendTransaction',
                  params: [{
                    from: provider.selectedAddress,
                    to: contracts.BetMarket.address,
                    value: Math.round(inputAmountOTM! * amountWei / amountOTM).toString(16),
                    data: web3.eth.abi.encodeFunctionCall({
                      name: 'fillSellOrder',
                      type: 'function',
                      inputs: [{
                        name: 'betId',
                        type: 'string',
                      }, {
                        name: 'orderId',
                        type: 'uint256',
                      }],
                    }, [betId, orderId.toString()]),
                    chainId: 31337,
                  },],
                });
                showNotification({
                  autoClose: 10000,
                  title: "The order has been filled successfullyy",
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
    <div className={classes.columnWrapper}>
      <NumberInput
        value={inputAmountOTM}
        onChange={(value) => setInputAmountOTM(value)}
        placeholder="Pick a number"
        label="OTM Amount"
        min={0}
        error={amountOTMError ? amountOTMError : false}
        styles={() => ({
          root: {
            width: '100%',
          },
        })}
      />

      <NumberInput
        value={inputAmountOTM !== undefined ? inputAmountOTM * amountWei / amountOTM : undefined}
        onChange={(value) => {
          value != undefined ? setInputAmountOTM(value * amountOTM / amountWei) : setInputAmountOTM(value);
        }}
        placeholder="Pick a number"
        label="Wei Amount"
        min={0}
        error={amountWeiError ? amountWeiError : false}
        styles={() => ({
          root: {
            width: '100%',
          },
        })}
      />

      <Button onClick={handleFillOrder} variant="subtle" compact>
        Fill
      </Button>
    </div>
  )
}
