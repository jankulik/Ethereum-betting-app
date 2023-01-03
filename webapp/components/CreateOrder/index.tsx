import { useStyles } from './styles';
import { useState } from 'react';
import { IconX, IconCheck, IconChevronDown } from '@tabler/icons';
import { Button, Select, Alert, NumberInput, Modal } from '@mantine/core';
import detectEthereumProvider from '@metamask/detect-provider';
import blockchainnet from '../../blockchainnet.json';
import contracts from '../../contracts.json';
import { AbiItem } from 'web3-utils'
import Web3 from 'web3';
import { showNotification } from '@mantine/notifications';
import FillOrder from '../FillOrder';

interface CreateOrderProps {
  betId: string;
  options: any;
  orders: any;
  openFillModal(orderId: number): any;
}

export default function CreateOrder({ betId, options, orders, openFillModal }: CreateOrderProps) {
  const { classes, cx } = useStyles();

  const [bestOrderId, setBestOrderId] = useState<number>();

  const [price, setPrice] = useState<number>();
  const [amountOTM, setAmountOTM] = useState<number>();
  const [amountWei, setAmountWei] = useState<number>();
  const [orderType, setOrderType] = useState<string | null>('buy');
  const [option, setOption] = useState<string | null>();

  const [optionError, setOptionError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [amountOTMError, setAmountOTMError] = useState('');
  const [amountWeiError, setAmountWeiError] = useState('');

  const Testnet = blockchainnet.Testnet;
  const TestnetRpc = blockchainnet.TestnetRpc;

  const web3 = new Web3((Web3 as any).currentProvider || new Web3.providers.HttpProvider(TestnetRpc));
  const BetMarket = new web3.eth.Contract(contracts.BetMarket.abi as unknown as AbiItem, contracts.BetMarket.address);

  const optionsData = options.map((option: any) => (
    { value: option, label: option }
  ));

  for (var i = 0; i < orders.length; i++) {
    if (orderType == 'buy' && orders[i].orderType == '1' && option == options[parseInt(orders[i].optionId)]) {
      if (bestOrderId != undefined) {
        if (orders[i].amountWei / orders[i].amountOTM < orders[bestOrderId].amountWei / orders[bestOrderId].amountOTM)
          setBestOrderId(i);
      } else {
        setBestOrderId(i)
      }
    } else if (orderType == 'sell' && orders[i].orderType == '0' && option == options[parseInt(orders[i].optionId)]) {
      if (bestOrderId != undefined) {
        if (orders[i].amountWei / orders[i].amountOTM > orders[bestOrderId].amountWei / orders[bestOrderId].amountOTM)
          setBestOrderId(i);
      } else {
        setBestOrderId(i)
      }
    }
  }

  const showFillOrder = () => {
    if (bestOrderId != undefined) {
      return (
        <Button onClick={() => {openFillModal(bestOrderId) }} variant="subtle" compact>
          Fill
        </Button>
      )
    }
  }

  const handleCreateOrder = () => {
    setOptionError('');
    setPriceError('');
    setAmountOTMError('');
    setAmountWeiError('');

    if (option == null)
      setOptionError('Option must be defined');
    if (price == undefined)
      setPriceError('Price must be define');
    if (price != undefined && (Math.round(price * 100) / 100 > 0.99 || Math.round(price * 100) / 100 < 0.01))
      setPriceError('Price must be between 0.01 and 0.99');
    if (amountOTM == undefined)
      setAmountOTMError('OTM amount must be defined');
    if (amountWei == undefined)
      setAmountWeiError('Wei amount must be defined');

    if (option != null &&
      price != undefined &&
      Math.round(price * 100) / 100 <= 0.99 &&
      Math.round(price * 100) / 100 >= 0.01 &&
      amountOTM != undefined &&
      amountWei != undefined)
      createOrder();
  }

  const createOrder = async () => {
    const provider = (await detectEthereumProvider()) as any;

    var optionId: number = options.length;
    for (var i = 0; i < options.length; i++) {
      if (options[i] == option)
        optionId = i;
    }

    if (provider) {
      console.log("found provider", "provider.selectedAddress:" + provider.selectedAddress);

      if (orderType == 'buy') {
        BetMarket.methods.createBuyOrder(betId, optionId, Math.round(amountOTM!))
          .estimateGas({ from: provider.selectedAddress, value: Math.round(amountWei!) }, async function (error: any) {
            if (error === null) {
              const count = await web3.eth.getTransactionCount(provider.selectedAddress);
              console.log(provider.selectedAddress, 'getTransactionCount:', count.toString(10));

              try {
                await provider.request({
                  method: 'eth_sendTransaction',
                  params: [{
                    from: provider.selectedAddress,
                    to: contracts.BetMarket.address,
                    value: Math.round(amountWei!).toString(16),
                    data: web3.eth.abi.encodeFunctionCall({
                      name: 'createBuyOrder',
                      type: 'function',
                      inputs: [{
                        name: 'betId',
                        type: 'string',
                      }, {
                        name: 'optionId',
                        type: 'uint256',
                      }, {
                        name: 'amountOTM',
                        type: 'uint256',
                      }],
                    }, [betId, optionId.toString(), Math.round(amountOTM!).toString()]),
                    chainId: 31337,
                  },],
                });
                showNotification({
                  autoClose: 10000,
                  title: "The order has been created successfully",
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
      } else if (orderType == 'sell') {
        BetMarket.methods.createSellOrder(betId, optionId, Math.round(amountOTM!), Math.round(amountWei!))
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
                      name: 'createSellOrder',
                      type: 'function',
                      inputs: [{
                        name: 'betId',
                        type: 'string',
                      }, {
                        name: 'optionId',
                        type: 'uint256',
                      }, {
                        name: 'amountOTM',
                        type: 'uint256',
                      }, {
                        name: 'amountWei',
                        type: 'uint256',
                      }],
                    }, [betId, optionId.toString(), Math.round(amountOTM!).toString(), Math.round(amountWei!).toString()]),
                    chainId: 31337,
                  },],
                });
                showNotification({
                  autoClose: 10000,
                  title: "The order has been created successfully",
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
      <Select
        value={orderType}
        onChange={setOrderType}
        rightSection={<IconChevronDown size={14} />}
        rightSectionWidth={28}
        data={[
          { value: 'buy', label: 'Buy order' },
          { value: 'sell', label: 'Sell order' },
        ]}
        styles={() => ({
          rightSection: {
            pointerEvents: 'none'
          },
          root: {
            width: '100%',
          },
        })}
      />

      <Select
        value={option}
        onChange={setOption}
        placeholder="Pick an option"
        rightSection={<IconChevronDown size={14} />}
        rightSectionWidth={28}
        data={optionsData}
        error={optionError ? optionError : false}
        styles={() => ({
          rightSection: {
            pointerEvents: 'none'
          },
          root: {
            width: '100%',
          },
        })}
      />

      <NumberInput
        value={price}
        onChange={(value) => {
          setPrice(value);
          (value != undefined && amountOTM != undefined) && setAmountWei(value * amountOTM);
          value == undefined && setAmountWei(value);
        }}
        placeholder="Pick a number"
        label="Price"
        precision={2}
        error={priceError ? priceError : false}
        styles={() => ({
          root: {
            width: '100%',
          },
        })}
      />

      <NumberInput
        value={amountOTM}
        onChange={(value) => {
          setAmountOTM(value);
          (value != undefined && price != undefined) && setAmountWei(value * price);
          value == undefined && setAmountWei(value);
        }}
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
        value={amountWei}
        disabled
        placeholder="Total value"
        label="Wei Amount"
        min={0}
        error={amountWeiError ? amountWeiError : false}
        styles={() => ({
          root: {
            width: '100%',
          },
        })}
      />

      {
        (orderType == 'buy' &&
          price != undefined &&
          bestOrderId != undefined &&
          price > orders[bestOrderId].amountWei / orders[bestOrderId].amountOTM &&
          option == options[parseInt(orders[bestOrderId].optionId)] &&
          orders[bestOrderId].status == 0) &&
        <Alert>
          <div className={classes.verticalContainer}>
            There exists a sell order with the price lower than the price you proposed. Do you want to fill it?
            {showFillOrder()}
          </div>
        </Alert>
      }

      {
        (orderType == 'sell' &&
          price != undefined &&
          bestOrderId != undefined &&
          price < orders[bestOrderId].amountWei / orders[bestOrderId].amountOTM &&
          option == options[parseInt(orders[bestOrderId].optionId)]) &&
        <Alert>
          <div className={classes.verticalContainer}>
            There exists a buy order with the price higher than the price you proposed. Do you want to fill it?
            {showFillOrder()}
          </div>
        </Alert>
      }

      <Button variant="subtle" compact onClick={handleCreateOrder}>
        Create order
      </Button>
    </div>
  )
}
